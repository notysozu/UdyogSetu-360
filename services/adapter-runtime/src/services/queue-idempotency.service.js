const queueJobRepository = require('../repositories/queue-job.repository');
const QueueJob = require('../models/QueueJob');

async function beginMessage(message, workerContext = {}) {
  const existing = await queueJobRepository.findByMessageId(message.messageId);
  if (existing?.status === 'processing' && existing.lockedAt) {
    const ageMs = Date.now() - existing.lockedAt.getTime();
    if (ageMs < Number(workerContext.lockTimeoutMs || 5 * 60 * 1000)) {
      return { skipped: true, reason: 'already_processing', job: existing };
    }
  }

  const completed = await hasCompleted(message.idempotencyKey);
  if (completed) {
    return { skipped: true, reason: 'already_completed', job: completed };
  }

  await queueJobRepository.createOrUpdateFromMessage(message, workerContext);
  await queueJobRepository.markProcessing(message.messageId, workerContext.workerId || 'worker');
  return { skipped: false };
}

async function completeMessage(message, result = {}) {
  return queueJobRepository.markSucceeded(message.messageId, result);
}

async function failMessage(message, error) {
  return queueJobRepository.markFailed(message.messageId, error);
}

async function hasCompleted(idempotencyKey) {
  if (!idempotencyKey) return null;
  return QueueJob.findOne({
    idempotencyKey,
    status: 'succeeded',
    isDeleted: false
  });
}

async function withQueueIdempotency(message, handler, workerContext = {}) {
  const started = await beginMessage(message, workerContext);
  if (started.skipped) {
    return { skipped: true, reason: started.reason, job: started.job };
  }
  try {
    const result = await handler();
    await completeMessage(message, result);
    return { processed: true, result };
  } catch (error) {
    await failMessage(message, error);
    throw error;
  }
}

module.exports = {
  beginMessage,
  completeMessage,
  failMessage,
  hasCompleted,
  withQueueIdempotency
};
