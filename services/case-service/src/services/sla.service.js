const slaTimerRepository = require('../repositories/sla-timer.repository');

async function startTimer(input, context = {}) {
  return slaTimerRepository.create({
    ...input,
    correlationId: context.correlationId,
    createdBy: context.userId,
    updatedBy: context.userId
  });
}

async function pauseTimer(timerId, reason, context = {}) {
  const timer = await slaTimerRepository.findById(timerId);
  if (!timer) {
    throw new Error('SLA timer not found.');
  }
  timer.status = 'paused';
  timer.pausedAt = new Date();
  timer.pauseHistory.push({
    pausedAt: timer.pausedAt,
    reason,
    pausedBy: context.userId || null
  });
  timer.updatedBy = context.userId || null;
  timer.correlationId = context.correlationId || timer.correlationId;
  await timer.save();
  return timer;
}

async function resumeTimer(timerId, context = {}) {
  const timer = await slaTimerRepository.findById(timerId);
  if (!timer) {
    throw new Error('SLA timer not found.');
  }
  timer.status = 'running';
  timer.resumedAt = new Date();
  const pauseEntry = timer.pauseHistory[timer.pauseHistory.length - 1];
  if (pauseEntry && !pauseEntry.resumedAt) {
    pauseEntry.resumedAt = timer.resumedAt;
  }
  timer.updatedBy = context.userId || null;
  await timer.save();
  return timer;
}

async function completeTimer(timerId, context = {}) {
  return slaTimerRepository.updateById(timerId, {
    status: 'completed',
    completedAt: new Date(),
    updatedBy: context.userId || null,
    correlationId: context.correlationId || null
  });
}

function findBreachedTimers(now = new Date()) {
  return slaTimerRepository.findBreached(now);
}

module.exports = {
  startTimer,
  pauseTimer,
  resumeTimer,
  completeTimer,
  findBreachedTimers
};
