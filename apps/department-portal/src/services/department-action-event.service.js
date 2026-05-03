const { appendDomainEvent } = require('../../../../services/case-service/src/services/event-outbox.service');
const { recordAuditEvent } = require('../../../../services/audit-service/src/services/audit.service');

async function appendDepartmentDomainEvent(eventName, payload, context = {}) {
  return appendDomainEvent({
    eventName,
    aggregateType: payload.aggregateType || 'task',
    aggregateId: String(payload.resourceId || payload.taskId || payload.caseId),
    universalCaseId: payload.universalCaseId || null,
    source: 'us360.department-portal',
    correlationId: context.correlationId || null,
    payload
  }, context).catch(() => null);
}

async function recordDepartmentAudit(action, resource, beforeAfter = {}, context = {}) {
  return recordAuditEvent({
    actor: {
      actorType: 'user',
      actorId: context.user?.id || context.user?._id || null,
      role: context.role || context.user?.primaryRole || context.user?.role || null,
      displayName: context.user?.name || null,
      serviceName: 'department-portal'
    },
    action,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    caseId: resource.caseId || null,
    universalCaseId: resource.universalCaseId || null,
    taskId: resource.taskId || null,
    grievanceId: resource.grievanceId || null,
    departmentCode: resource.departmentCode || context.departmentCode || null,
    before: beforeAfter.before || null,
    after: beforeAfter.after || null,
    reason: context.overrideReason || resource.reason || null,
    outcome: 'success',
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null,
    metadata: resource.metadata || {}
  }, context).catch(() => null);
}

async function emitAndAudit(eventName, auditAction, resource, payload, context = {}) {
  await appendDepartmentDomainEvent(eventName, payload, context);
  await recordDepartmentAudit(auditAction, resource, { before: resource.before, after: resource.after }, context);
}

module.exports = {
  appendDepartmentDomainEvent,
  recordDepartmentAudit,
  emitAndAudit
};
