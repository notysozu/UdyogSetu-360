const { randomUUID } = require('crypto');
const ReplayAttempt = require('./ReplayAttempt');
const DomainEvent = require('../../../case-service/src/models/DomainEvent');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

async function createReplayAttempt(input, context = {}) {
  if (String(process.env.REPLAY_REQUIRE_REASON || 'true') === 'true' && !String(input.reason || '').trim()) {
    throw new Error('Replay reason is required.');
  }
  const replayId = randomUUID();
  const dryRun = input.dryRun ?? (String(process.env.REPLAY_DRY_RUN_DEFAULT || 'true') === 'true');
  const attempt = await ReplayAttempt.create({
    replayId,
    requestedBy: context.userId || null,
    requestedByRole: context.role || null,
    reason: input.reason,
    mode: input.mode || (dryRun ? 'dry_run' : 'republish'),
    filter: input.filter || {},
    status: 'requested',
    dryRun,
    correlationId: context.correlationId || null
  });
  await recordAuditEvent({
    actor: context.actor || { actorType: 'user', actorId: context.userId || null, role: context.role || null },
    action: 'replay.requested',
    resourceType: 'replay_attempt',
    resourceId: replayId,
    correlationId: context.correlationId || null,
    metadata: { mode: attempt.mode, dryRun: attempt.dryRun }
  }, context).catch(() => {});
  return attempt;
}

async function runReplay(replayId, context = {}) {
  const attempt = await ReplayAttempt.findOne({ replayId });
  if (!attempt) throw new Error('Replay attempt not found.');
  attempt.status = 'running';
  attempt.startedAt = new Date();
  await attempt.save();
  await recordAuditEvent({
    actor: context.actor || { actorType: 'user', actorId: context.userId || null, role: context.role || null },
    action: 'replay.started',
    resourceType: 'replay_attempt',
    resourceId: replayId,
    correlationId: context.correlationId || null
  }, context).catch(() => {});

  const limit = Math.min(Number(process.env.REPLAY_MAX_EVENTS || 1000), 2000);
  const events = await DomainEvent.find(attempt.filter || {}).sort({ createdAt: -1 }).limit(limit).lean().catch(() => []);
  attempt.totalEvents = events.length;
  if (attempt.dryRun || attempt.mode === 'dry_run') {
    attempt.processedEvents = events.length;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    await attempt.save();
    await recordAuditEvent({
      actor: context.actor || { actorType: 'user', actorId: context.userId || null, role: context.role || null },
      action: 'replay.completed',
      resourceType: 'replay_attempt',
      resourceId: replayId,
      correlationId: context.correlationId || null,
      metadata: { dryRun: true, totalEvents: events.length }
    }, context).catch(() => {});
    return attempt;
  }

  attempt.processedEvents = events.length;
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  await attempt.save();
  await recordAuditEvent({
    actor: context.actor || { actorType: 'user', actorId: context.userId || null, role: context.role || null },
    action: 'replay.completed',
    resourceType: 'replay_attempt',
    resourceId: replayId,
    correlationId: context.correlationId || null,
    metadata: { dryRun: false, totalEvents: events.length }
  }, context).catch(() => {});
  return attempt;
}

function listReplayAttempts(filter = {}, pagination = {}) {
  const page = Math.max(Number(pagination.page) || 1, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || 25, 1), 100);
  const skip = (page - 1) * limit;
  return Promise.all([
    ReplayAttempt.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ReplayAttempt.countDocuments(filter)
  ]).then(([items, total]) => ({ items, total, page, limit }));
}

function getReplayAttempt(replayId) {
  return ReplayAttempt.findOne({ replayId }).lean();
}

async function cancelReplay(replayId, context = {}) {
  const attempt = await ReplayAttempt.findOneAndUpdate(
    { replayId, status: { $in: ['requested', 'running'] } },
    { $set: { status: 'cancelled', completedAt: new Date() } },
    { new: true }
  );
  if (!attempt) return null;
  await recordAuditEvent({
    actor: context.actor || { actorType: 'user', actorId: context.userId || null, role: context.role || null },
    action: 'replay.cancelled',
    resourceType: 'replay_attempt',
    resourceId: replayId,
    correlationId: context.correlationId || null
  }, context).catch(() => {});
  return attempt;
}

module.exports = {
  createReplayAttempt,
  runReplay,
  listReplayAttempts,
  getReplayAttempt,
  cancelReplay
};
