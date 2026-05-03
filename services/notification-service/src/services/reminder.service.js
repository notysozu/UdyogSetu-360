const reminderRepository = require('../../../case-service/src/repositories/reminder-job.repository');
const notificationService = require('./notification.service');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

function contextMeta(context = {}) {
  return {
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    user: context.user || { actorType: 'system', actorId: 'notification-service', role: 'system' }
  };
}

async function scheduleReminder(input, context = {}) {
  const created = await reminderRepository.create({
    ...input,
    status: 'scheduled',
    attemptCount: input.attemptCount || 0,
    maxAttempts: input.maxAttempts || Number(process.env.NOTIFICATION_MAX_RETRIES || 3),
    correlationId: context.correlationId || null,
    createdBy: context.userId || null,
    updatedBy: context.userId || null
  });
  await appendDomainEvent({
    eventName: EVENT_NAMES.REMINDER_SCHEDULED,
    aggregateType: 'reminder',
    aggregateId: String(created._id),
    universalCaseId: created.universalCaseId || null,
    payload: { reminderType: created.reminderType, entityType: created.entityType, entityId: created.entityId }
  }, contextMeta(context)).catch(() => {});
  await recordAuditEvent({
    actor: contextMeta(context).user,
    action: 'reminder.scheduled',
    resourceType: 'reminder_job',
    resourceId: String(created._id),
    caseId: created.caseId || null,
    universalCaseId: created.universalCaseId || null,
    correlationId: context.correlationId || null
  }).catch(() => {});
  return created;
}

async function cancelReminder(jobId, reason, context = {}) {
  return reminderRepository.updateById(jobId, {
    status: 'cancelled',
    cancelledAt: new Date(),
    failureReason: reason || 'cancelled',
    updatedBy: context.userId || null
  });
}

async function sendReminder(reminderJob, context = {}) {
  const notification = await notificationService.queueNotification({
    recipientUserId: reminderJob.metadata?.recipientUserId || null,
    recipientRole: reminderJob.metadata?.recipientRole || null,
    recipientDepartmentCode: reminderJob.metadata?.recipientDepartmentCode || null,
    caseId: reminderJob.caseId || null,
    universalCaseId: reminderJob.universalCaseId || null,
    taskId: reminderJob.taskId || null,
    grievanceId: reminderJob.grievanceId || null,
    channel: reminderJob.metadata?.channel || 'in_app',
    templateCode: reminderJob.metadata?.templateCode || 'renewal_reminder',
    title: reminderJob.metadata?.title || 'Reminder',
    body: reminderJob.metadata?.body || 'A pending item needs attention.',
    priority: reminderJob.metadata?.priority || 'normal',
    metadata: reminderJob.metadata || {}
  }, context);
  await notificationService.sendNotification(notification._id, context);
  await reminderRepository.updateById(reminderJob._id, {
    status: 'sent',
    executedAt: new Date(),
    notificationId: notification._id,
    updatedBy: context.userId || null
  });
  await appendDomainEvent({
    eventName: EVENT_NAMES.REMINDER_SENT,
    aggregateType: 'reminder',
    aggregateId: String(reminderJob._id),
    universalCaseId: reminderJob.universalCaseId || null,
    payload: { reminderType: reminderJob.reminderType, notificationId: String(notification._id) }
  }, contextMeta(context)).catch(() => {});
  await recordAuditEvent({
    actor: contextMeta(context).user,
    action: 'reminder.sent',
    resourceType: 'reminder_job',
    resourceId: String(reminderJob._id),
    caseId: reminderJob.caseId || null,
    universalCaseId: reminderJob.universalCaseId || null,
    correlationId: context.correlationId || null
  }).catch(() => {});
  return notification;
}

async function executeDueReminders(now = new Date(), context = {}) {
  const jobs = await reminderRepository.findDueJobs(now, Number(process.env.NOTIFICATION_BATCH_SIZE || 50));
  const results = [];
  for (const job of jobs) {
    try {
      await reminderRepository.updateById(job._id, { status: 'processing', attemptCount: Number(job.attemptCount || 0) + 1 });
      results.push(await sendReminder(job, context));
    } catch (error) {
      const attempts = Number(job.attemptCount || 0) + 1;
      await reminderRepository.updateById(job._id, {
        status: attempts >= Number(job.maxAttempts || 3) ? 'failed' : 'scheduled',
        failureReason: 'reminder_dispatch_failed',
        attemptCount: attempts
      });
    }
  }
  return results;
}

function scheduleRenewalReminder(certificate, context = {}) {
  if (!certificate?.validUntil) return null;
  const due = new Date(certificate.validUntil);
  due.setDate(due.getDate() - 30);
  return scheduleReminder({
    jobCode: `renewal-${certificate.certificateNumber}-${due.toISOString().slice(0, 10)}`,
    entityType: 'certificate',
    entityId: certificate._id || certificate.id,
    caseId: certificate.caseId || null,
    universalCaseId: certificate.universalCaseId || null,
    reminderType: 'certificate_renewal',
    scheduledFor: due,
    metadata: {
      templateCode: 'renewal_reminder',
      title: 'Certificate renewal reminder',
      body: `Certificate ${certificate.certificateNumber} is approaching expiry.`,
      recipientUserId: certificate.issuedToUserId || null
    }
  }, context);
}

function scheduleQueryResponseReminder(query, context = {}) {
  return scheduleReminder({
    jobCode: `query-response-${query._id}`,
    entityType: 'task',
    entityId: query.taskId || query._id,
    caseId: query.caseId || null,
    universalCaseId: query.universalCaseId || null,
    taskId: query.taskId || null,
    reminderType: 'query_response_due',
    scheduledFor: query.dueAt || new Date(Date.now() + Number(process.env.REMINDER_LOOKAHEAD_HOURS || 24) * 3600000),
    metadata: {
      templateCode: 'task_query_raised',
      title: 'Query response due',
      body: query.subject || 'A query response is due.',
      recipientUserId: query.recipientUserId || null
    }
  }, context);
}

function scheduleFeePaymentReminder(fee, context = {}) {
  return scheduleReminder({
    jobCode: `fee-payment-${fee._id}`,
    entityType: 'fee',
    entityId: fee._id,
    caseId: fee.caseId || null,
    universalCaseId: fee.universalCaseId || null,
    taskId: fee.taskId || null,
    reminderType: 'fee_payment_due',
    scheduledFor: fee.dueAt || new Date(Date.now() + Number(process.env.REMINDER_LOOKAHEAD_HOURS || 24) * 3600000),
    metadata: {
      templateCode: 'fee_demanded',
      title: 'Fee payment due',
      body: fee.remarks || 'A fee payment is due.',
      recipientUserId: fee.raisedBy || null
    }
  }, context);
}

module.exports = {
  scheduleReminder,
  cancelReminder,
  executeDueReminders,
  sendReminder,
  scheduleRenewalReminder,
  scheduleQueryResponseReminder,
  scheduleFeePaymentReminder
};
