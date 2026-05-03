const { randomUUID } = require('crypto');
const grievanceRepository = require('../repositories/grievance.repository');
const { appendDomainEvent } = require('./event-outbox.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');
const slaMonitoringService = require('../../../notification-service/src/services/sla-monitoring.service');

const PRIORITY_DUE_DAYS = {
  low: Number(process.env.GRIEVANCE_LOW_DUE_DAYS || 7),
  normal: Number(process.env.GRIEVANCE_DEFAULT_DUE_DAYS || 5),
  high: Number(process.env.GRIEVANCE_HIGH_DUE_DAYS || 3),
  urgent: Number(process.env.GRIEVANCE_URGENT_DUE_DAYS || 1)
};

function ctxUser(context = {}) {
  return context.user || {
    actorType: 'user',
    actorId: context.userId || null,
    role: context.role || null
  };
}

function getDueAt(priority = 'normal') {
  const days = PRIORITY_DUE_DAYS[priority] || PRIORITY_DUE_DAYS.normal;
  return new Date(Date.now() + days * 86400000);
}

function buildStatusEntry(grievance, toStatus, reason, context = {}) {
  return {
    fromStatus: grievance?.status || null,
    toStatus,
    changedBy: context.userId || null,
    changedByRole: context.role || null,
    changedAt: new Date(),
    reason: reason || null,
    metadata: {}
  };
}

async function emitAndAudit(eventName, auditAction, grievance, payload, context = {}) {
  await appendDomainEvent({
    eventName,
    aggregateType: 'grievance',
    aggregateId: String(grievance._id),
    universalCaseId: grievance.universalCaseId || null,
    payload
  }, context).catch(() => {});
  await recordAuditEvent({
    actor: ctxUser(context),
    action: auditAction,
    resourceType: 'grievance',
    resourceId: String(grievance._id),
    caseId: grievance.caseId || null,
    universalCaseId: grievance.universalCaseId || null,
    grievanceId: grievance._id,
    departmentCode: grievance.departmentCode || null,
    correlationId: context.correlationId || null,
    metadata: payload
  }, context).catch(() => {});
}

function canView(user, grievance) {
  const role = user.primaryRole || user.role;
  if (['admin', 'nodal_officer', 'auditor'].includes(role)) return true;
  if (role === 'investor') return String(grievance.organisationId || '') === String(user.organisationId || '');
  if (['department_officer', 'department_supervisor'].includes(role)) return grievance.departmentCode === user.departmentCode;
  return false;
}

async function createGrievance(input, context = {}) {
  const grievanceNumber = input.grievanceNumber || `GRV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const dueAt = input.dueAt ? new Date(input.dueAt) : getDueAt(input.priority || 'normal');
  const grievance = await grievanceRepository.create({
    grievanceNumber,
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    taskId: input.taskId || null,
    organisationId: input.organisationId || null,
    raisedBy: input.raisedBy || context.userId || null,
    raisedByRole: input.raisedByRole || context.role || null,
    departmentCode: input.departmentCode || null,
    category: input.category,
    subject: input.subject,
    description: input.description,
    priority: input.priority || 'normal',
    source: input.source || 'investor_portal',
    status: 'open',
    dueAt,
    warningAt: new Date(dueAt.getTime() - 24 * 3600000),
    attachments: input.attachments || [],
    messages: [],
    statusHistory: [{
      fromStatus: null,
      toStatus: 'open',
      changedBy: context.userId || null,
      changedByRole: context.role || null,
      changedAt: new Date(),
      reason: 'created'
    }],
    correlationId: context.correlationId || null,
    metadata: input.metadata || {},
    createdBy: context.userId || null,
    updatedBy: context.userId || null
  });
  await emitAndAudit(EVENT_NAMES.GRIEVANCE_CREATED, 'grievance.created', grievance, { grievanceId: String(grievance._id), grievanceNumber }, context);
  await slaMonitoringService.startTimer('grievance', grievance._id, {
    timerType: 'grievance_resolution',
    caseId: grievance.caseId,
    universalCaseId: grievance.universalCaseId,
    grievanceId: grievance._id,
    departmentCode: grievance.departmentCode,
    priority: grievance.priority,
    dueAt: grievance.dueAt
  }, context).catch(() => {});
  return grievance;
}

async function acknowledgeGrievance(grievanceId, context = {}) {
  const grievance = await grievanceRepository.findById(grievanceId, { activeOnly: true });
  if (!grievance) throw new Error('Grievance not found.');
  const updated = await grievanceRepository.pushStatusHistory(
    grievanceId,
    buildStatusEntry(grievance, 'acknowledged', 'acknowledged', context),
    { status: 'acknowledged', acknowledgedAt: new Date() },
    context
  );
  await emitAndAudit(EVENT_NAMES.GRIEVANCE_ACKNOWLEDGED, 'grievance.acknowledged', updated, { grievanceId: String(updated._id) }, context);
  return updated;
}

async function assignGrievance(grievanceId, assignee, context = {}) {
  const grievance = await grievanceRepository.findById(grievanceId, { activeOnly: true });
  if (!grievance) throw new Error('Grievance not found.');
  const updated = await grievanceRepository.pushStatusHistory(
    grievanceId,
    buildStatusEntry(grievance, grievance.status, 'assigned', context),
    {
      assignedTo: assignee.assignedTo || assignee.userId,
      assignedRole: assignee.assignedRole || null
    },
    context
  );
  await emitAndAudit(EVENT_NAMES.GRIEVANCE_ASSIGNED, 'grievance.assigned', updated, {
    grievanceId: String(updated._id),
    assignedTo: String(assignee.assignedTo || assignee.userId || '')
  }, context);
  return updated;
}

async function addMessage(grievanceId, input, context = {}) {
  const grievance = await grievanceRepository.findById(grievanceId, { activeOnly: true });
  if (!grievance) throw new Error('Grievance not found.');
  const message = {
    messageId: randomUUID(),
    authorUserId: context.userId || null,
    authorRole: context.role || null,
    authorDepartmentCode: context.departmentCode || null,
    body: input.body,
    visibility: input.visibility || 'department_visible',
    attachments: input.attachments || [],
    isSystemGenerated: false,
    createdAt: new Date(),
    metadata: input.metadata || {}
  };
  const updated = await grievanceRepository.pushMessage(grievanceId, message, context);
  await emitAndAudit(EVENT_NAMES.GRIEVANCE_MESSAGE_ADDED, 'grievance.message_added', updated, {
    grievanceId: String(updated._id),
    visibility: message.visibility
  }, context);
  return updated;
}

function addInternalComment(grievanceId, input, context = {}) {
  return addMessage(grievanceId, { ...input, visibility: 'internal' }, context).then(async (updated) => {
    await emitAndAudit(EVENT_NAMES.GRIEVANCE_INTERNAL_COMMENT_ADDED, 'grievance.internal_comment_added', updated, {
      grievanceId: String(updated._id)
    }, context);
    return updated;
  });
}

function addExternalReply(grievanceId, input, context = {}) {
  return addMessage(grievanceId, { ...input, visibility: 'investor_visible' }, context).then(async (updated) => {
    await emitAndAudit(EVENT_NAMES.GRIEVANCE_EXTERNAL_REPLY_ADDED, 'grievance.external_reply_added', updated, {
      grievanceId: String(updated._id)
    }, context);
    return updated;
  });
}

async function changeStatus(grievanceId, nextStatus, reason, context = {}) {
  const grievance = await grievanceRepository.findById(grievanceId, { activeOnly: true });
  if (!grievance) throw new Error('Grievance not found.');
  const patch = { status: nextStatus };
  if (nextStatus === 'resolved') patch.resolvedAt = new Date();
  if (nextStatus === 'closed') patch.closedAt = new Date();
  const updated = await grievanceRepository.pushStatusHistory(
    grievanceId,
    buildStatusEntry(grievance, nextStatus, reason, context),
    patch,
    context
  );
  await emitAndAudit(EVENT_NAMES.GRIEVANCE_STATUS_CHANGED, 'grievance.status_changed', updated, {
    grievanceId: String(updated._id),
    fromStatus: grievance.status,
    toStatus: nextStatus,
    reason
  }, context);
  if (['resolved', 'closed'].includes(nextStatus)) {
    const activeTimer = await require('../repositories/sla-timer.repository').findActiveByEntity('grievance', grievance._id);
    if (activeTimer?._id) {
      await slaMonitoringService.completeTimer(activeTimer._id, context).catch(() => {});
    }
  }
  return updated;
}

async function resolveGrievance(grievanceId, input, context = {}) {
  if (!input.resolutionSummary) throw new Error('resolutionSummary is required.');
  const updated = await changeStatus(grievanceId, 'resolved', input.reason || 'resolved', context);
  return grievanceRepository.updateById(updated._id, {
    resolutionSummary: input.resolutionSummary,
    satisfactionRating: input.satisfactionRating || null,
    updatedBy: context.userId || null
  });
}

async function closeGrievance(grievanceId, input, context = {}) {
  if (!input.closureReason) throw new Error('closureReason is required.');
  const updated = await changeStatus(grievanceId, 'closed', input.reason || 'closed', context);
  return grievanceRepository.updateById(updated._id, {
    closureReason: input.closureReason,
    updatedBy: context.userId || null
  });
}

function reopenGrievance(grievanceId, input, context = {}) {
  return changeStatus(grievanceId, 'reopened', input.reason || 'reopened', context);
}

async function escalateGrievance(grievanceId, input, context = {}) {
  const grievance = await grievanceRepository.findById(grievanceId, { activeOnly: true });
  if (!grievance) throw new Error('Grievance not found.');
  const nextLevel = Number(grievance.escalationLevel || 0) + 1;
  const updated = await grievanceRepository.pushStatusHistory(
    grievanceId,
    buildStatusEntry(grievance, 'escalated', input.reason || 'escalated', context),
    {
      status: 'escalated',
      escalationLevel: nextLevel,
      currentEscalationOwner: input.currentEscalationOwner || null
    },
    context
  );
  await emitAndAudit(EVENT_NAMES.GRIEVANCE_ESCALATED, 'grievance.escalated', updated, {
    grievanceId: String(updated._id),
    escalationLevel: nextLevel
  }, context);
  return updated;
}

async function listGrievances(user, filters = {}, pagination = {}, context = {}) {
  const data = await grievanceRepository.listByUserScope(user, filters, pagination);
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      messages: (item.messages || []).filter((message) =>
        (user.primaryRole || user.role) === 'investor' ? message.visibility !== 'internal' && message.visibility !== 'audit_only' : true
      )
    }))
  };
}

async function getGrievanceDetail(user, grievanceId) {
  const grievance = await grievanceRepository.findById(grievanceId, { activeOnly: true });
  if (!grievance) throw new Error('Grievance not found.');
  if (!canView(user, grievance)) throw Object.assign(new Error('Access denied.'), { status: 403 });
  const dto = grievance.toObject();
  if ((user.primaryRole || user.role) === 'investor') {
    dto.messages = (dto.messages || []).filter((message) => !['internal', 'audit_only'].includes(message.visibility));
  }
  return dto;
}

async function getGrievanceAgeingDashboard(user, filters = {}, context = {}) {
  return slaMonitoringService.getGrievanceAgeingDashboard(user, filters, context);
}

module.exports = {
  createGrievance,
  acknowledgeGrievance,
  assignGrievance,
  addMessage,
  addInternalComment,
  addExternalReply,
  changeStatus,
  resolveGrievance,
  closeGrievance,
  reopenGrievance,
  escalateGrievance,
  listGrievances,
  getGrievanceDetail,
  getGrievanceAgeingDashboard
};
