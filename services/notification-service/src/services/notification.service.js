const notificationRepository = require('../repositories/notification.repository');
const templateService = require('./message-template.service');
const { getEmailProvider, getSmsProvider } = require('../providers/provider-factory');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src/constants/event-names.constants');

const emailProvider = getEmailProvider();
const smsProvider = getSmsProvider();

function buildContextMeta(context = {}) {
  return {
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  };
}

async function emitAndAudit(eventName, auditAction, resourceId, payload = {}, context = {}) {
  await appendDomainEvent({
    eventName,
    aggregateType: 'notification',
    aggregateId: String(resourceId),
    universalCaseId: payload.universalCaseId || null,
    payload
  }, context).catch(() => {});

  await recordAuditEvent({
    actor: context.user || { actorId: context.userId || null, role: context.role || null, actorType: 'user' },
    action: auditAction,
    resourceType: 'notification',
    resourceId: String(resourceId),
    caseId: payload.caseId || null,
    universalCaseId: payload.universalCaseId || null,
    correlationId: context.correlationId || null,
    metadata: payload
  }, context).catch(() => {});
}

async function createInAppNotification(input, context = {}) {
  const created = await notificationRepository.create({
    ...input,
    channel: 'in_app',
    status: input.status || 'queued',
    correlationId: context.correlationId,
    createdBy: context.userId,
    updatedBy: context.userId
  });
  await emitAndAudit(EVENT_NAMES.NOTIFICATION_QUEUED, 'notification.created', created._id, {
    notificationId: String(created._id),
    channel: created.channel,
    caseId: created.caseId || null,
    universalCaseId: created.universalCaseId || null
  }, context);
  return created;
}

async function queueNotification(input, context = {}) {
  const locale = input.locale || 'en';
  let rendered = { subject: input.subject || '', body: input.body || '', sms: input.body || '' };
  if (input.templateCode) {
    rendered = await templateService.renderTemplate(input.templateCode, input.channel || 'in_app', locale, input.variables || {});
  }
  const created = await notificationRepository.create(
    {
      ...input,
      subject: input.subject || rendered.subject,
      body: input.body || rendered.body || rendered.sms,
      status: 'queued'
    },
    context
  );
  await emitAndAudit(EVENT_NAMES.NOTIFICATION_QUEUED, 'notification.created', created._id, {
    notificationId: String(created._id),
    channel: created.channel,
    templateCode: created.templateCode
  }, context);
  return created;
}

async function dispatchViaProvider(notification, context = {}) {
  if (notification.channel === 'email') {
    if (String(process.env.NOTIFICATIONS_ENABLE_EMAIL || 'false') !== 'true') return { ok: true, providerMessageId: 'email-disabled' };
    return emailProvider.sendEmail({
      to: notification.metadata?.to,
      subject: notification.subject || notification.title || 'Notification',
      html: notification.body,
      text: notification.body,
      metadata: notification.metadata
    }, context);
  }
  if (notification.channel === 'sms') {
    if (String(process.env.NOTIFICATIONS_ENABLE_SMS || 'false') !== 'true') return { ok: true, providerMessageId: 'sms-disabled' };
    return smsProvider.sendSms({
      to: notification.metadata?.to,
      message: notification.body,
      metadata: notification.metadata
    }, context);
  }
  return { ok: true, providerMessageId: 'in-app' };
}

async function sendNotification(notificationId, context = {}) {
  const notification = typeof notificationId === 'object'
    ? notificationId
    : await notificationRepository.findById(notificationId, { activeOnly: true });
  if (!notification) throw new Error('Notification not found.');
  try {
    const providerResponse = await dispatchViaProvider(notification, context);
    const updated = await notificationRepository.updateById(notification._id, {
      status: notification.channel === 'in_app' ? 'delivered' : 'sent',
      provider: notification.channel === 'email' ? String(process.env.EMAIL_PROVIDER || 'dev') : notification.channel === 'sms' ? String(process.env.SMS_PROVIDER || 'dev') : 'in_app',
      providerMessageId: providerResponse.providerMessageId,
      sentAt: new Date(),
      deliveredAt: notification.channel === 'in_app' ? new Date() : null,
      updatedBy: context.userId || null
    });
    await emitAndAudit(EVENT_NAMES.NOTIFICATION_SENT, 'notification.sent', notification._id, {
      notificationId: String(notification._id),
      channel: notification.channel
    }, context);
    return updated;
  } catch (error) {
    const updated = await notificationRepository.updateById(notification._id, {
      status: 'failed',
      failedAt: new Date(),
      failureReason: 'delivery_failed',
      retryCount: Number(notification.retryCount || 0) + 1,
      updatedBy: context.userId || null
    });
    await emitAndAudit(EVENT_NAMES.NOTIFICATION_FAILED, 'notification.failed', notification._id, {
      notificationId: String(notification._id),
      channel: notification.channel
    }, context);
    return updated;
  }
}

async function sendBulkNotifications(inputs, context = {}) {
  const records = await Promise.all((inputs || []).map((input) => queueNotification(input, context)));
  return Promise.all(records.map((record) => sendNotification(record._id, context)));
}

async function markRead(notificationId, user, context = {}) {
  const existing = await notificationRepository.findById(notificationId, { activeOnly: true });
  if (!existing) throw new Error('Notification not found.');
  const role = user?.primaryRole || user?.role;
  if (role === 'investor' && String(existing.recipientUserId) !== String(user.id || user._id)) {
    throw Object.assign(new Error('Access denied.'), { status: 403 });
  }
  const updated = await notificationRepository.updateById(notificationId, {
    status: 'read',
    readAt: new Date(),
    updatedBy: context.userId || user?.id || null,
    correlationId: context.correlationId
  });
  await emitAndAudit(EVENT_NAMES.NOTIFICATION_READ, 'notification.read', notificationId, {
    notificationId: String(notificationId)
  }, context);
  return updated;
}

async function markAllRead(user, context = {}) {
  const update = await notificationRepository.markAllReadForUser(user);
  await recordAuditEvent({
    actor: context.user || { actorType: 'user', actorId: user.id || user._id || null, role: user.primaryRole || user.role || null },
    action: 'notification.read',
    resourceType: 'notification',
    resourceId: 'bulk',
    correlationId: context.correlationId || null,
    metadata: { modifiedCount: update.modifiedCount || 0, bulk: true }
  }, context).catch(() => {});
  return update;
}

function listUserNotifications(user, filters = {}, pagination = {}, _context = {}) {
  return notificationRepository.listUserNotifications(user, filters, pagination);
}

async function cancelNotification(notificationId, reason, context = {}) {
  return notificationRepository.updateById(notificationId, {
    status: 'cancelled',
    failureReason: reason || 'cancelled',
    updatedBy: context.userId || null
  });
}

async function retryFailedNotification(notificationId, context = {}) {
  const notification = await notificationRepository.findById(notificationId, { activeOnly: true });
  if (!notification) throw new Error('Notification not found.');
  if (Number(notification.retryCount || 0) >= Number(notification.maxRetries || process.env.NOTIFICATION_MAX_RETRIES || 3)) {
    throw new Error('Notification max retries reached.');
  }
  await notificationRepository.updateById(notificationId, {
    status: 'queued',
    failureReason: null,
    scheduledFor: new Date(),
    updatedBy: context.userId || null
  });
  return sendNotification(notificationId, context);
}

async function dispatchQueuedNotifications(now = new Date(), context = {}) {
  const queued = await notificationRepository.findQueued(now, Number(process.env.NOTIFICATION_BATCH_SIZE || 50));
  const results = [];
  for (const notification of queued) {
    results.push(await sendNotification(notification, context));
  }
  return results;
}

function listNotifications(filter = {}, options = {}) {
  return notificationRepository.paginate(filter, options);
}

module.exports = {
  createNotification: createInAppNotification,
  createInAppNotification,
  queueNotification,
  sendNotification,
  sendBulkNotifications,
  dispatchQueuedNotifications,
  markRead,
  markAllRead,
  listUserNotifications,
  cancelNotification,
  retryFailedNotification,
  listNotifications
};
