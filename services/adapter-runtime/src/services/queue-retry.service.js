const {
  RABBITMQ_ROUTING_KEYS,
  QueuePoisonMessageError
} = require('../../../../packages/shared/src');
const queueJobRepository = require('../repositories/queue-job.repository');

function calculateBackoffDelay(attempt, options = {}) {
  const baseDelay = Number(options.baseDelayMs || process.env.RABBITMQ_RETRY_BASE_DELAY_MS || 5000);
  const maxDelay = Number(options.maxDelayMs || process.env.RABBITMQ_RETRY_MAX_DELAY_MS || 900000);
  const jitter =
    options.jitterMs === undefined ? Math.floor(Math.random() * 1000) : Number(options.jitterMs);
  return Math.min(baseDelay * 2 ** Math.max(0, attempt) + jitter, maxDelay);
}

function incrementAttempt(message) {
  return {
    ...message,
    attempt: Number(message.attempt || 0) + 1
  };
}

function shouldRetry(error, message) {
  if (error?.retryable === false) return false;
  return Number(message.attempt || 0) < Number(message.maxAttempts || process.env.RABBITMQ_RETRY_MAX_ATTEMPTS || 8);
}

function markPoisonIfNeeded(message, error) {
  const poisonAttempts = Number(process.env.RABBITMQ_POISON_MAX_ATTEMPTS || 3);
  const sameSignature = error?.code || error?.name || 'QUEUE_ERROR';
  if (error instanceof QueuePoisonMessageError) {
    return true;
  }
  if (error?.retryable === false && Number(message.attempt || 0) >= poisonAttempts) {
    return true;
  }
  return sameSignature === 'QueueValidationError' && Number(message.attempt || 0) >= 1;
}

async function scheduleRetry(message, error, context = {}) {
  const delayMs = calculateBackoffDelay(message.attempt || 0, context);
  const nextRunAt = new Date(Date.now() + delayMs);
  const retried = incrementAttempt(message);
  retried.notBefore = nextRunAt.toISOString();
  retried.metadata = {
    ...(retried.metadata || {}),
    retry: {
      delayMs,
      lastErrorCode: error.code || error.name || 'QUEUE_ERROR',
      lastErrorMessage: error.message
    }
  };
  retried.headers = {
    'x-retry-count': retried.attempt,
    'x-original-exchange': context.originalExchange || null,
    'x-original-routing-key': message.routingKey,
    'x-first-death-reason': retried.metadata?.retry?.firstDeathReason || error.code || error.name || 'error',
    'x-last-error-code': error.code || error.name || 'QUEUE_ERROR',
    'x-last-error-message': error.message
  };

  const { publishRetryMessage } = require('../producers/queue-producer');
  await publishRetryMessage(retried, delayMs, context);
  await queueJobRepository.markRetryScheduled(retried.messageId, error, nextRunAt);
  return { retried, nextRunAt, delayMs };
}

async function sendToDeadLetter(message, error, context = {}) {
  const { publishDeadLetterMessage } = require('../producers/queue-producer');
  const deadLetterRoutingKey =
    context.deadLetterRoutingKey ||
    (String(message.messageType).includes('callback')
      ? RABBITMQ_ROUTING_KEYS.deadletterCallback
      : RABBITMQ_ROUTING_KEYS.deadletterDelivery);
  await publishDeadLetterMessage(message, error, {
    ...context,
    deadLetterRoutingKey
  });
  await queueJobRepository.markDeadLettered(message.messageId, error);
  return { deadLetterRoutingKey };
}

module.exports = {
  calculateBackoffDelay,
  scheduleRetry,
  shouldRetry,
  incrementAttempt,
  markPoisonIfNeeded,
  sendToDeadLetter
};
