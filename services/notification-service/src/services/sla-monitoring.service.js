const slaTimerRepository = require('../../../case-service/src/repositories/sla-timer.repository');
const escalationService = require('./escalation.service');
const reminderService = require('./reminder.service');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

const DEPARTMENT_APPROVAL_DAYS = {
  pollution: 30,
  power: 21,
  fire: 15,
  industrial_safety: 30,
  labour: 15
};

const GRIEVANCE_DUE_DAYS = {
  low: Number(process.env.GRIEVANCE_LOW_DUE_DAYS || 7),
  normal: Number(process.env.GRIEVANCE_DEFAULT_DUE_DAYS || 5),
  high: Number(process.env.GRIEVANCE_HIGH_DUE_DAYS || 3),
  urgent: Number(process.env.GRIEVANCE_URGENT_DUE_DAYS || 1)
};

function computeWarningAt(startsAt, dueAt, priority = 'normal') {
  if (priority === 'urgent') return new Date(new Date(dueAt).getTime() - 24 * 3600000);
  const warningPercentage = Number(process.env.SLA_WARNING_PERCENTAGE || 80) / 100;
  const duration = new Date(dueAt).getTime() - new Date(startsAt).getTime();
  return new Date(new Date(startsAt).getTime() + duration * warningPercentage);
}

function getDueByDepartment(departmentCode) {
  return Number(DEPARTMENT_APPROVAL_DAYS[departmentCode] || 21);
}

function getDueByPriority(priority) {
  return Number(GRIEVANCE_DUE_DAYS[priority || 'normal'] || GRIEVANCE_DUE_DAYS.normal);
}

async function createSlaTimer(input, context = {}) {
  const startsAt = input.startsAt || new Date();
  const dueAt = input.dueAt || new Date(new Date(startsAt).getTime() + (input.durationMinutes || 60) * 60000);
  return slaTimerRepository.create({
    ...input,
    startsAt,
    dueAt,
    warningAt: input.warningAt || computeWarningAt(startsAt, dueAt, input.priority),
    status: 'running',
    correlationId: context.correlationId || null,
    createdBy: context.userId || null,
    updatedBy: context.userId || null
  });
}

async function startTimer(entityType, entityId, input = {}, context = {}) {
  const startsAt = input.startsAt || new Date();
  const dueDays = input.timerType === 'grievance_resolution'
    ? getDueByPriority(input.priority)
    : getDueByDepartment(input.departmentCode);
  const dueAt = input.dueAt || new Date(new Date(startsAt).getTime() + dueDays * 86400000);
  const timer = await createSlaTimer({
    entityType,
    entityId,
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    taskId: input.taskId || null,
    grievanceId: input.grievanceId || null,
    departmentCode: input.departmentCode || null,
    timerType: input.timerType || 'approval',
    startsAt,
    dueAt,
    metadata: input.metadata || {},
    priority: input.priority || 'normal'
  }, context);
  await appendDomainEvent({
    eventName: EVENT_NAMES.SLA_TIMER_STARTED,
    aggregateType: 'sla_timer',
    aggregateId: String(timer._id),
    universalCaseId: timer.universalCaseId || null,
    payload: { timerId: String(timer._id), timerType: timer.timerType, dueAt: timer.dueAt }
  }, context).catch(() => {});
  await recordAuditEvent({
    actor: context.user || { actorType: 'system', actorId: 'notification-service', role: 'system' },
    action: 'sla.timer_started',
    resourceType: 'sla_timer',
    resourceId: String(timer._id),
    caseId: timer.caseId || null,
    universalCaseId: timer.universalCaseId || null,
    correlationId: context.correlationId || null
  }, context).catch(() => {});
  return timer;
}

async function pauseTimer(timerId, reason, context = {}) {
  const timer = await slaTimerRepository.findById(timerId, { activeOnly: true });
  if (!timer) throw new Error('SLA timer not found.');
  timer.status = 'paused';
  timer.pausedAt = new Date();
  timer.pauseHistory.push({ pausedAt: timer.pausedAt, reason, pausedBy: context.userId || null });
  timer.updatedBy = context.userId || null;
  await timer.save();
  return timer;
}

async function resumeTimer(timerId, context = {}) {
  const timer = await slaTimerRepository.findById(timerId, { activeOnly: true });
  if (!timer) throw new Error('SLA timer not found.');
  timer.status = 'running';
  timer.resumedAt = new Date();
  timer.updatedBy = context.userId || null;
  const latestPause = timer.pauseHistory[timer.pauseHistory.length - 1];
  if (latestPause && !latestPause.resumedAt) latestPause.resumedAt = timer.resumedAt;
  await timer.save();
  return timer;
}

async function completeTimer(timerId, context = {}) {
  return slaTimerRepository.updateById(timerId, {
    status: 'completed',
    completedAt: new Date(),
    updatedBy: context.userId || null
  });
}

async function cancelTimer(timerId, reason, context = {}) {
  return slaTimerRepository.updateById(timerId, {
    status: 'cancelled',
    metadata: { cancelReason: reason || null },
    updatedBy: context.userId || null
  });
}

async function evaluateWarnings(now = new Date(), context = {}) {
  const timers = await slaTimerRepository.findWarningCandidates(now, Number(process.env.NOTIFICATION_BATCH_SIZE || 50));
  const results = [];
  for (const timer of timers) {
    await slaTimerRepository.updateById(timer._id, { status: 'warning', warningSentAt: now });
    await reminderService.scheduleReminder({
      jobCode: `sla-warning-${timer._id}-${now.toISOString()}`,
      entityType: timer.entityType || 'task',
      entityId: timer.entityId || timer.taskId || timer.grievanceId || timer.caseId,
      caseId: timer.caseId || null,
      universalCaseId: timer.universalCaseId || null,
      taskId: timer.taskId || null,
      grievanceId: timer.grievanceId || null,
      reminderType: 'sla_warning',
      scheduledFor: new Date(),
      metadata: {
        recipientRole: 'department_officer',
        recipientDepartmentCode: timer.departmentCode || null,
        templateCode: 'sla_warning',
        title: 'SLA warning',
        body: `${timer.timerType} is approaching SLA due time.`
      }
    }, context);
    await appendDomainEvent({
      eventName: EVENT_NAMES.SLA_WARNING,
      aggregateType: 'sla_timer',
      aggregateId: String(timer._id),
      universalCaseId: timer.universalCaseId || null,
      payload: { timerId: String(timer._id), timerType: timer.timerType }
    }, context).catch(() => {});
    await recordAuditEvent({
      actor: context.user || { actorType: 'system', actorId: 'notification-service', role: 'system' },
      action: 'sla.warning',
      resourceType: 'sla_timer',
      resourceId: String(timer._id),
      caseId: timer.caseId || null,
      universalCaseId: timer.universalCaseId || null,
      correlationId: context.correlationId || null
    }, context).catch(() => {});
    results.push(timer._id);
  }
  return results;
}

async function evaluateBreaches(now = new Date(), context = {}) {
  const timers = await slaTimerRepository.findBreachCandidates(now, Number(process.env.NOTIFICATION_BATCH_SIZE || 50));
  const results = [];
  for (const timer of timers) {
    await slaTimerRepository.updateById(timer._id, { status: 'breached', breachedAt: now, breachNotifiedAt: now });
    await appendDomainEvent({
      eventName: EVENT_NAMES.SLA_BREACHED,
      aggregateType: 'sla_timer',
      aggregateId: String(timer._id),
      universalCaseId: timer.universalCaseId || null,
      payload: { timerId: String(timer._id), timerType: timer.timerType }
    }, context).catch(() => {});
    await recordAuditEvent({
      actor: context.user || { actorType: 'system', actorId: 'notification-service', role: 'system' },
      action: 'sla.breached',
      resourceType: 'sla_timer',
      resourceId: String(timer._id),
      caseId: timer.caseId || null,
      universalCaseId: timer.universalCaseId || null,
      correlationId: context.correlationId || null
    }, context).catch(() => {});
    results.push(timer._id);
  }
  return timers;
}

async function escalateOverdueItems(now = new Date(), context = {}) {
  if (String(process.env.SLA_ESCALATION_ENABLED || 'true') !== 'true') return [];
  const breached = await slaTimerRepository.findBreached(now);
  const results = [];
  for (const timer of breached) {
    results.push(await escalationService.escalateEntity(timer.entityType || 'task', timer.entityId || timer.taskId || timer.grievanceId || timer.caseId, 'sla_overdue', context));
  }
  return results;
}

async function evaluateAll(now = new Date(), context = {}) {
  const warnings = await evaluateWarnings(now, context);
  const breaches = await evaluateBreaches(now, context);
  const escalations = await escalateOverdueItems(now, context);
  return { warnings: warnings.length, breaches: breaches.length, escalations: escalations.length };
}

function buildAgeBuckets(timers = [], now = new Date()) {
  const buckets = { '0-2 days': 0, '3-7 days': 0, '8-15 days': 0, '16-30 days': 0, '31+ days': 0 };
  for (const timer of timers) {
    const ageDays = Math.floor((now.getTime() - new Date(timer.startsAt).getTime()) / 86400000);
    if (ageDays <= 2) buckets['0-2 days'] += 1;
    else if (ageDays <= 7) buckets['3-7 days'] += 1;
    else if (ageDays <= 15) buckets['8-15 days'] += 1;
    else if (ageDays <= 30) buckets['16-30 days'] += 1;
    else buckets['31+ days'] += 1;
  }
  return buckets;
}

async function getApprovalAgeingDashboard(user, filters = {}) {
  const scope = {};
  const role = user.primaryRole || user.role;
  if (['department_officer', 'department_supervisor'].includes(role)) scope.departmentCode = user.departmentCode;
  if (filters.departmentCode) scope.departmentCode = filters.departmentCode;
  const timers = await slaTimerRepository.findApprovalAgeingRows(scope);
  return {
    ageBuckets: buildAgeBuckets(timers),
    overdueCount: timers.filter((timer) => ['breached', 'escalated'].includes(timer.status)).length,
    warningCount: timers.filter((timer) => timer.status === 'warning').length,
    oldestPendingHours: timers.length ? Math.max(...timers.map((timer) => (Date.now() - new Date(timer.startsAt).getTime()) / 3600000)) : 0,
    dueIn24Hours: timers.filter((timer) => new Date(timer.dueAt).getTime() - Date.now() <= 24 * 3600000 && new Date(timer.dueAt).getTime() > Date.now()).length,
    rows: timers
  };
}

async function getGrievanceAgeingDashboard(user, filters = {}) {
  const scope = {};
  const role = user.primaryRole || user.role;
  if (['department_officer', 'department_supervisor'].includes(role)) scope.departmentCode = user.departmentCode;
  if (filters.departmentCode) scope.departmentCode = filters.departmentCode;
  const timers = await slaTimerRepository.findGrievanceAgeingRows(scope);
  return {
    ageBuckets: buildAgeBuckets(timers),
    overdueCount: timers.filter((timer) => ['breached', 'escalated'].includes(timer.status)).length,
    warningCount: timers.filter((timer) => timer.status === 'warning').length,
    escalatedCount: timers.filter((timer) => timer.status === 'escalated').length,
    rows: timers
  };
}

module.exports = {
  createSlaTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  completeTimer,
  cancelTimer,
  evaluateWarnings,
  evaluateBreaches,
  escalateOverdueItems,
  evaluateAll,
  getApprovalAgeingDashboard,
  getGrievanceAgeingDashboard
};
