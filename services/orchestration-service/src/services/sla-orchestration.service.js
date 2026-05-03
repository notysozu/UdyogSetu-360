const {
  DOMAIN_EVENT_NAMES,
  computeSlaDueAt
} = require('../../../../packages/shared/src');
const slaRepository = require('../repositories/sla.repository');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');

const DEPARTMENT_SLA_DAYS = Object.freeze({
  pollution: 30,
  power: 21,
  fire: 15,
  industrial_safety: 30,
  labour: 15
});

function buildWarningAt(startsAt, dueAt) {
  const percentage = Math.max(Number(process.env.SLA_WARNING_PERCENTAGE) || 80, 1) / 100;
  const duration = dueAt.getTime() - startsAt.getTime();
  return new Date(startsAt.getTime() + duration * percentage);
}

function buildTimerInput(input = {}) {
  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
  const dueAt =
    input.dueAt ||
    computeSlaDueAt(startsAt, input.slaDays || DEPARTMENT_SLA_DAYS[input.departmentCode] || 21);
  return {
    ...input,
    startsAt,
    dueAt,
    warningAt: input.warningAt || buildWarningAt(startsAt, dueAt)
  };
}

async function upsertRunningTimer(filter, payload) {
  let timer = await slaRepository.findOne({ ...filter, status: { $nin: ['completed', 'cancelled'] } });
  if (!timer) {
    timer = await slaRepository.create({
      ...payload,
      ...filter,
      status: 'running'
    });
  }
  return timer;
}

async function emitSlaEvent(eventName, timer, context = {}) {
  await appendDomainEvent(
    {
      eventName,
      aggregateType: 'sla_timer',
      aggregateId: timer.id,
      universalCaseId: timer.universalCaseId || null,
      payload: {
        timerId: timer.id,
        caseId: timer.caseId,
        taskId: timer.taskId,
        status: timer.status
      }
    },
    context
  );
}

async function startCaseSla(caseDoc, context = {}) {
  const payload = buildTimerInput({
    caseId: caseDoc._id,
    universalCaseId: caseDoc.universalCaseId,
    timerType: 'case',
    startsAt: caseDoc.submittedAt || new Date(),
    dueAt: caseDoc.slaSummary?.dueAt,
    warningAt: caseDoc.slaSummary?.warningAt
  });
  const timer = await upsertRunningTimer({ caseId: caseDoc._id, timerType: 'case' }, payload);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_TIMER_STARTED, timer, context);
  return timer;
}

async function startTaskSla(taskDoc, context = {}) {
  const payload = buildTimerInput({
    caseId: taskDoc.caseId,
    taskId: taskDoc._id,
    universalCaseId: taskDoc.universalCaseId,
    departmentCode: taskDoc.departmentCode,
    timerType: 'task',
    startsAt: taskDoc.createdAt || new Date(),
    dueAt: taskDoc.dueAt,
    warningAt: taskDoc.warningAt
  });
  const timer = await upsertRunningTimer({ taskId: taskDoc._id, timerType: 'task' }, payload);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_TIMER_STARTED, timer, context);
  return timer;
}

async function pauseSla(entityType, entityId, reason, context = {}) {
  const query = entityType === 'case' ? { caseId: entityId } : { taskId: entityId };
  const timer = await slaRepository.findOne({ ...query, status: { $in: ['running', 'warning'] } });
  if (!timer) {
    return null;
  }
  timer.status = 'paused';
  timer.pausedAt = new Date();
  timer.pauseHistory.push({
    pausedAt: timer.pausedAt,
    reason,
    pausedBy: context.actor?._id || null
  });
  await slaRepository.save(timer);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_TIMER_PAUSED, timer, context);
  return timer;
}

async function resumeSla(entityType, entityId, context = {}) {
  const query = entityType === 'case' ? { caseId: entityId } : { taskId: entityId };
  const timer = await slaRepository.findOne({ ...query, status: 'paused' });
  if (!timer) {
    return null;
  }
  timer.status = 'running';
  timer.resumedAt = new Date();
  const lastPause = timer.pauseHistory[timer.pauseHistory.length - 1];
  if (lastPause && !lastPause.resumedAt) {
    lastPause.resumedAt = timer.resumedAt;
  }
  await slaRepository.save(timer);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_TIMER_RESUMED, timer, context);
  return timer;
}

async function completeSla(entityType, entityId, context = {}) {
  const query = entityType === 'case' ? { caseId: entityId } : { taskId: entityId };
  const timer = await slaRepository.findOne({ ...query, status: { $nin: ['completed', 'cancelled'] } });
  if (!timer) {
    return null;
  }
  timer.status = 'completed';
  timer.completedAt = new Date();
  await slaRepository.save(timer);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_COMPLETED, timer, context);
  return timer;
}

async function cancelSla(entityType, entityId, context = {}) {
  const query = entityType === 'case' ? { caseId: entityId } : { taskId: entityId };
  const timer = await slaRepository.findOne({ ...query, status: { $nin: ['completed', 'cancelled'] } });
  if (!timer) {
    return null;
  }
  timer.status = 'cancelled';
  await slaRepository.save(timer);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_CANCELLED, timer, context);
  return timer;
}

async function markWarning(timerId, context = {}) {
  const timer = await slaRepository.findOne({ _id: timerId });
  if (!timer || ['warning', 'breached', 'completed', 'cancelled'].includes(timer.status)) {
    return timer;
  }
  timer.status = 'warning';
  await slaRepository.save(timer);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_WARNING, timer, context);
  return timer;
}

async function markBreached(timerId, context = {}) {
  const timer = await slaRepository.findOne({ _id: timerId });
  if (!timer || ['breached', 'completed', 'cancelled'].includes(timer.status)) {
    return timer;
  }
  timer.status = 'breached';
  timer.breachedAt = new Date();
  timer.escalationLevel += 1;
  await slaRepository.save(timer);
  await emitSlaEvent(DOMAIN_EVENT_NAMES.SLA_BREACHED, timer, context);
  return timer;
}

async function evaluateSlaTimers(now = new Date(), context = {}) {
  const currentTime = new Date(now);
  const warnings = await slaRepository.findWarnings(currentTime);
  const breached = await slaRepository.findBreached(currentTime);
  const warningResults = await Promise.all(warnings.map((timer) => markWarning(timer._id, context)));
  const breachResults = await Promise.all(breached.map((timer) => markBreached(timer._id, context)));
  return {
    warnings: warningResults.length,
    breached: breachResults.length
  };
}

module.exports = {
  DEPARTMENT_SLA_DAYS,
  startCaseSla,
  startTaskSla,
  pauseSla,
  resumeSla,
  completeSla,
  cancelSla,
  evaluateSlaTimers,
  markWarning,
  markBreached
};
