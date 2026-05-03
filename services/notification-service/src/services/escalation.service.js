const policyRepository = require('../../../case-service/src/repositories/escalation-policy.repository');
const slaTimerRepository = require('../../../case-service/src/repositories/sla-timer.repository');
const reminderService = require('./reminder.service');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

async function getEscalationPolicy(entityType, departmentCode, priority = 'normal', category = null) {
  return policyRepository.findPolicy(entityType, departmentCode || null, priority, category);
}

async function assignEscalationOwner(timer, owner, context = {}) {
  return slaTimerRepository.updateById(timer._id, {
    currentEscalationOwner: owner || null,
    updatedBy: context.userId || null
  });
}

async function recordEscalationHistory(timer, escalation, context = {}) {
  return slaTimerRepository.updateById(timer._id, {
    $push: { escalationHistory: escalation },
    escalationLevel: escalation.level,
    status: 'escalated',
    updatedBy: context.userId || null
  });
}

async function notifyEscalationOwners(timer, policyLevel, context = {}) {
  const notifications = [];
  for (const role of policyLevel.notifyRoles || []) {
    notifications.push(reminderService.scheduleReminder({
      jobCode: `sla-escalation-${timer._id}-${policyLevel.level}-${role}-${Date.now()}`,
      entityType: timer.entityType || 'task',
      entityId: timer.entityId || timer.taskId || timer.grievanceId || timer.caseId,
      caseId: timer.caseId || null,
      universalCaseId: timer.universalCaseId || null,
      taskId: timer.taskId || null,
      grievanceId: timer.grievanceId || null,
      reminderType: 'sla_breach',
      scheduledFor: new Date(),
      metadata: {
        recipientRole: role,
        templateCode: 'sla_breached',
        title: 'SLA escalation',
        body: `Escalation level ${policyLevel.level} triggered for ${timer.timerType}.`
      }
    }, context));
  }
  return Promise.all(notifications);
}

async function executeEscalationLevel(timer, policyLevel, context = {}) {
  await notifyEscalationOwners(timer, policyLevel, context);
  await recordEscalationHistory(
    timer,
    {
      level: policyLevel.level,
      action: policyLevel.action,
      notifyRoles: policyLevel.notifyRoles || [],
      triggeredAt: new Date().toISOString(),
      reason: 'sla_overdue'
    },
    context
  );
  await appendDomainEvent({
    eventName: EVENT_NAMES.SLA_ESCALATED,
    aggregateType: 'sla_timer',
    aggregateId: String(timer._id),
    universalCaseId: timer.universalCaseId || null,
    payload: {
      timerId: String(timer._id),
      level: policyLevel.level,
      action: policyLevel.action,
      timerType: timer.timerType
    }
  }, context).catch(() => {});
  await recordAuditEvent({
    actor: context.user || { actorType: 'system', actorId: 'notification-service', role: 'system' },
    action: 'sla.escalated',
    resourceType: 'sla_timer',
    resourceId: String(timer._id),
    caseId: timer.caseId || null,
    universalCaseId: timer.universalCaseId || null,
    correlationId: context.correlationId || null,
    metadata: { level: policyLevel.level, action: policyLevel.action }
  }, context).catch(() => {});
}

async function escalateEntity(entityType, entityId, reason, context = {}) {
  const timer = await slaTimerRepository.findActiveByEntity(entityType, entityId);
  if (!timer) throw new Error('SLA timer not found for escalation.');
  const policy = await getEscalationPolicy(entityType, timer.departmentCode, timer.metadata?.priority || 'normal', timer.metadata?.category || null);
  const levels = policy?.levels || [
    { level: 1, action: 'notify', notifyRoles: ['department_officer', 'department_supervisor'] },
    { level: 2, action: 'assign_nodal', notifyRoles: ['department_supervisor', 'nodal_officer'] },
    { level: 3, action: 'escalate_admin', notifyRoles: ['admin'] }
  ];
  const nextLevel = levels.find((level) => Number(level.level) > Number(timer.escalationLevel || 0)) || levels[levels.length - 1];
  await executeEscalationLevel(timer, nextLevel, { ...context, reason });
  return slaTimerRepository.findById(timer._id, { activeOnly: true });
}

module.exports = {
  getEscalationPolicy,
  escalateEntity,
  executeEscalationLevel,
  notifyEscalationOwners,
  assignEscalationOwner,
  recordEscalationHistory
};
