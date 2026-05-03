const { randomUUID, createHash } = require('crypto');
const { DEPARTMENT_CODE_VALUES } = require('../constants/department.constants');
const {
  RABBITMQ_MESSAGE_TYPES,
  RABBITMQ_ALLOWED_ROUTING_KEYS
} = require('../constants/rabbitmq.constants');
const { QueueValidationError } = require('../errors/queue-errors');

function buildQueueMessageEnvelope(input = {}) {
  const routingKey = input.routingKey;
  if (!routingKey || !RABBITMQ_ALLOWED_ROUTING_KEYS.includes(routingKey)) {
    throw new QueueValidationError(`Unsupported routing key: ${routingKey || 'missing'}`);
  }

  if (input.departmentCode && !DEPARTMENT_CODE_VALUES.includes(input.departmentCode)) {
    throw new QueueValidationError(`Unsupported department code: ${input.departmentCode}`);
  }

  const messageType = input.messageType || RABBITMQ_MESSAGE_TYPES.DEPARTMENT_DELIVERY_REQUESTED;
  const now = new Date().toISOString();
  const payload = input.payload || {};
  const correlationId = input.correlationId || randomUUID();
  const entity = input.entity
    ? {
        entityType: input.entity.entityType || null,
        entityId: input.entity.entityId || null,
        universalCaseId: input.entity.universalCaseId || null
      }
    : undefined;

  return {
    messageId: input.messageId || randomUUID(),
    messageType,
    source: input.source || 'us360.adapter-runtime',
    correlationId,
    causationId: input.causationId || null,
    idempotencyKey:
      input.idempotencyKey ||
      createHash('sha256')
        .update(JSON.stringify({ routingKey, correlationId, payload, entity }))
        .digest('hex'),
    createdAt: input.createdAt || now,
    notBefore: input.notBefore || null,
    attempt: Number.isInteger(input.attempt) ? input.attempt : 0,
    maxAttempts: Number.isInteger(input.maxAttempts) ? input.maxAttempts : 8,
    departmentCode: input.departmentCode || null,
    routingKey,
    entity: entity || null,
    payload,
    metadata: input.metadata || {}
  };
}

module.exports = { buildQueueMessageEnvelope };
