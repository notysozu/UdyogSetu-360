const { randomUUID } = require('crypto');
const queueJobRepository = require('../repositories/queue-job.repository');
const { publishQueueMessage } = require('../producers/queue-producer');

async function requeueQueueJob(job, reason, context = {}) {
  if (!reason) {
    throw new Error('Requeue reason is required.');
  }

  const sourceMessage = {
    messageId: randomUUID(),
    messageType: job.messageType,
    source: 'us360.adapter-runtime.recovery',
    correlationId: job.correlationId,
    causationId: job.messageId,
    idempotencyKey: job.idempotencyKey,
    createdAt: new Date().toISOString(),
    attempt: context.force ? 0 : job.attemptCount,
    maxAttempts: job.maxAttempts,
    departmentCode: job.departmentCode,
    routingKey: job.originalRoutingKey || job.routingKey,
    entity: {
      entityType: job.entityType,
      entityId: job.entityId,
      universalCaseId: job.universalCaseId
    },
    payload: job.metadata?.originalPayload || {},
    metadata: {
      ...(job.metadata || {}),
      recovery: {
        reason,
        requeuedAt: new Date().toISOString(),
        requeuedBy: context.actor?.id || 'system',
        requeueCount: Number(job.metadata?.recovery?.requeueCount || 0) + 1
      },
      originalMessageId: job.messageId
    }
  };

  const exchange = String(job.messageType).includes('callback')
    ? 'us360.department.callback'
    : 'us360.department.delivery';
  const result = await publishQueueMessage(exchange, sourceMessage.routingKey, sourceMessage);
  await queueJobRepository.createOrUpdateFromMessage(sourceMessage, {
    queueName: job.queueName,
    exchange,
    metadata: {
      originalPayload: sourceMessage.payload
    }
  });
  return result;
}

module.exports = { requeueQueueJob };
