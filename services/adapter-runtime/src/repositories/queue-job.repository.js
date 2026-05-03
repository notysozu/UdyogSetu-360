const { createHash } = require('crypto');
const {
  RABBITMQ_QUEUE_STATUSES
} = require('../../../../packages/shared/src');
const QueueJob = require('../models/QueueJob');

function sanitizeError(error) {
  if (!error) return {};
  return {
    failureCode: error.code || error.name || 'QUEUE_ERROR',
    failureMessage: error.message || 'Queue processing failed',
    lastErrorStack: error.stack || null
  };
}

async function createOrUpdateFromMessage(message, queueContext = {}) {
  const payloadHash = createHash('sha256').update(JSON.stringify(message.payload || {})).digest('hex');
  return QueueJob.findOneAndUpdate(
    { messageId: message.messageId },
    {
      $set: {
        messageType: message.messageType,
        queueName: queueContext.queueName || null,
        exchange: queueContext.exchange || null,
        routingKey: message.routingKey,
        originalRoutingKey: queueContext.originalRoutingKey || message.routingKey,
        departmentCode: message.departmentCode || null,
        entityType: message.entity?.entityType || null,
        entityId: message.entity?.entityId || null,
        universalCaseId: message.entity?.universalCaseId || message.payload?.universalCaseId || null,
        idempotencyKey: message.idempotencyKey,
        correlationId: message.correlationId,
        payloadHash,
        attemptCount: message.attempt || 0,
        maxAttempts: message.maxAttempts || 8,
        nextRunAt: message.notBefore ? new Date(message.notBefore) : new Date(),
        metadata: {
          ...(queueContext.metadata || {}),
          originalPayload: message.payload || {},
          payloadSummary: {
            keys: Object.keys(message.payload || {})
          }
        }
      },
      $setOnInsert: {
        status: RABBITMQ_QUEUE_STATUSES.QUEUED
      }
    },
    { upsert: true, new: true }
  );
}

function markProcessing(messageId, workerId) {
  return QueueJob.findOneAndUpdate(
    { messageId },
    {
      $set: {
        status: RABBITMQ_QUEUE_STATUSES.PROCESSING,
        lockedAt: new Date(),
        lockedBy: workerId,
        lastAttemptAt: new Date()
      }
    },
    { new: true }
  );
}

function markSucceeded(messageId, result = {}) {
  return QueueJob.findOneAndUpdate(
    { messageId },
    {
      $set: {
        status: RABBITMQ_QUEUE_STATUSES.SUCCEEDED,
        completedAt: new Date(),
        metadata: {
          result
        }
      },
      $unset: {
        lockedAt: 1,
        lockedBy: 1
      }
    },
    { new: true }
  );
}

function markRetryScheduled(messageId, error, nextRunAt) {
  return QueueJob.findOneAndUpdate(
    { messageId },
    {
      $set: {
        status: RABBITMQ_QUEUE_STATUSES.RETRY_SCHEDULED,
        nextRunAt,
        ...sanitizeError(error)
      },
      $unset: {
        lockedAt: 1,
        lockedBy: 1
      }
    },
    { new: true }
  );
}

function markFailed(messageId, error) {
  return QueueJob.findOneAndUpdate(
    { messageId },
    {
      $set: {
        status: RABBITMQ_QUEUE_STATUSES.FAILED,
        ...sanitizeError(error)
      },
      $unset: {
        lockedAt: 1,
        lockedBy: 1
      }
    },
    { new: true }
  );
}

function markDeadLettered(messageId, error) {
  return QueueJob.findOneAndUpdate(
    { messageId },
    {
      $set: {
        status: RABBITMQ_QUEUE_STATUSES.DEAD_LETTERED,
        deadLetteredAt: new Date(),
        ...sanitizeError(error)
      },
      $unset: {
        lockedAt: 1,
        lockedBy: 1
      }
    },
    { new: true }
  );
}

function findByMessageId(messageId) {
  return QueueJob.findOne({ messageId, isDeleted: false });
}

function findDeadLettered(filter = {}, pagination = {}) {
  return QueueJob.find({
    ...filter,
    status: RABBITMQ_QUEUE_STATUSES.DEAD_LETTERED,
    isDeleted: false
  })
    .sort({ deadLetteredAt: -1 })
    .limit(Number(pagination.limit || 50))
    .skip(Number(pagination.skip || 0));
}

function findRetryable(filter = {}, pagination = {}) {
  return QueueJob.find({
    ...filter,
    status: { $in: [RABBITMQ_QUEUE_STATUSES.RETRY_SCHEDULED, RABBITMQ_QUEUE_STATUSES.FAILED] },
    isDeleted: false
  })
    .sort({ nextRunAt: 1, updatedAt: -1 })
    .limit(Number(pagination.limit || 50))
    .skip(Number(pagination.skip || 0));
}

function cancelJob(messageId, reason) {
  return QueueJob.findOneAndUpdate(
    { messageId },
    {
      $set: {
        status: RABBITMQ_QUEUE_STATUSES.CANCELLED,
        failureMessage: reason || 'Cancelled',
        metadata: {
          cancellationReason: reason || 'Cancelled'
        }
      }
    },
    { new: true }
  );
}

module.exports = {
  createOrUpdateFromMessage,
  markProcessing,
  markSucceeded,
  markRetryScheduled,
  markFailed,
  markDeadLettered,
  findByMessageId,
  findDeadLettered,
  findRetryable,
  cancelJob
};
