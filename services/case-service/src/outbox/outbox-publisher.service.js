const os = require('os');
const { createLogger } = require('../../../../packages/shared/src/logger');
const { publishEvent, publishDeadLetter } = require('../../../../packages/shared/src/kafka/event-producer');
const {
  RetryableEventError,
  NonRetryableEventError
} = require('../../../../packages/shared/src/errors/event-errors');
const outboxRepository = require('./outbox.repository');

const logger = createLogger('outbox-publisher');
const workerId = `${os.hostname()}:${process.pid}`;
let intervalHandle = null;

function calculateNextRetry(attemptCount) {
  const baseDelay = Number(process.env.OUTBOX_RETRY_BASE_DELAY_MS || 1000);
  const maxDelay = Number(process.env.OUTBOX_RETRY_MAX_DELAY_MS || 60000);
  const delay = Math.min(baseDelay * 2 ** Math.max(attemptCount - 1, 0), maxDelay);
  return new Date(Date.now() + delay);
}

async function publishOne(outboxEvent) {
  try {
    const kafkaResult = await publishEvent(outboxEvent.envelope || outboxEvent.payload || outboxEvent, {
      topic: outboxEvent.topic
    });
    await outboxRepository.markPublished(outboxEvent.eventId, kafkaResult);
    logger.info('outbox_event_published', {
      eventId: outboxEvent.eventId,
      eventName: outboxEvent.eventName,
      topic: outboxEvent.topic,
      partitionKey: outboxEvent.partitionKey,
      correlationId: outboxEvent.correlationId,
      publishStatus: 'published'
    });
    return { published: true };
  } catch (error) {
    if (error instanceof NonRetryableEventError) {
      await publishDeadLetter(outboxEvent.envelope || outboxEvent, error, { source: 'us360.outbox.dead-letter' });
      await outboxRepository.markDeadLettered(outboxEvent.eventId, error.message);
      return { deadLettered: true };
    }

    const nextPublishAt = calculateNextRetry((outboxEvent.publishAttempts || 0) + 1);
    const maxAttempts = Number(process.env.OUTBOX_MAX_ATTEMPTS || 10);
    if ((outboxEvent.publishAttempts || 0) + 1 >= maxAttempts) {
      await publishDeadLetter(outboxEvent.envelope || outboxEvent, error, { source: 'us360.outbox.dead-letter' });
      await outboxRepository.markDeadLettered(outboxEvent.eventId, error.message);
      return { deadLettered: true };
    }
    await outboxRepository.markFailed(outboxEvent.eventId, error, nextPublishAt);
    logger.warn('outbox_event_publish_retry_scheduled', {
      eventId: outboxEvent.eventId,
      eventName: outboxEvent.eventName,
      topic: outboxEvent.topic,
      partitionKey: outboxEvent.partitionKey,
      correlationId: outboxEvent.correlationId,
      publishStatus: 'failed',
      errorCode: error.code || 'EVENT_PUBLISH_ERROR'
    });
    return { retryScheduled: true };
  }
}

async function publishPendingBatch() {
  const batchSize = Number(process.env.OUTBOX_PUBLISH_BATCH_SIZE || 50);
  const pending = await outboxRepository.findPendingForPublish(batchSize, workerId);
  for (const event of pending) {
    const locked = await outboxRepository.markPublishing(event.eventId, workerId);
    if (!locked) {
      continue;
    }
    await publishOne(locked);
  }
  return pending.length;
}

async function recoverStaleLocks() {
  const lockTimeoutMs = Number(process.env.IDEMPOTENCY_LOCK_SECONDS || 30) * 1000;
  return outboxRepository.unlockStalePublishingLocks(lockTimeoutMs);
}

function startOutboxPublisher() {
  if (intervalHandle) {
    return intervalHandle;
  }
  const intervalMs = Number(process.env.OUTBOX_PUBLISH_INTERVAL_MS || 5000);
  intervalHandle = setInterval(async () => {
    try {
      await recoverStaleLocks();
      await publishPendingBatch();
    } catch (error) {
      logger.error('outbox_publisher_tick_failed', {
        errorCode: error.code || 'OUTBOX_PUBLISHER_ERROR',
        errorMessage: error.message
      });
    }
  }, intervalMs);
  return intervalHandle;
}

function stopOutboxPublisher() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  startOutboxPublisher,
  stopOutboxPublisher,
  publishPendingBatch,
  publishOne,
  calculateNextRetry,
  recoverStaleLocks
};
