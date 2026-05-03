const {
  buildQueueMessageEnvelope,
  createConfirmChannel,
  isRabbitEnabled,
  RABBITMQ_EXCHANGES,
  RABBITMQ_ROUTING_KEYS,
  RABBITMQ_MESSAGE_TYPES,
  QueuePublishError
} = require('../../../../packages/shared/src');

function buildPublishHeaders(message, extraHeaders = {}) {
  return {
    'x-correlation-id': message.correlationId,
    'x-idempotency-key': message.idempotencyKey,
    'x-message-type': message.messageType,
    ...extraHeaders
  };
}

async function publishQueueMessage(exchange, routingKey, message, options = {}) {
  if (!isRabbitEnabled()) {
    return {
      disabled: true,
      exchange,
      routingKey,
      messageId: message.messageId
    };
  }

  const channel = await createConfirmChannel();
  try {
    const envelope = buildQueueMessageEnvelope({
      ...message,
      routingKey
    });
    const headers = buildPublishHeaders(envelope, options.headers || {});
    const payload = Buffer.from(JSON.stringify(envelope));

    channel.publish(exchange, routingKey, payload, {
      persistent: true,
      messageId: envelope.messageId,
      correlationId: envelope.correlationId,
      timestamp: Date.now(),
      contentType: 'application/json',
      expiration: options.expiration ? String(options.expiration) : undefined,
      headers
    });
    await channel.waitForConfirms();
    return {
      ok: true,
      exchange,
      routingKey,
      messageId: envelope.messageId,
      correlationId: envelope.correlationId
    };
  } catch (error) {
    throw new QueuePublishError('Failed to publish queue message.', { message: error.message });
  } finally {
    await channel.close().catch(() => {});
  }
}

async function publishDepartmentDeliveryJob(departmentCode, jobType, payload, context = {}) {
  const routingKey = RABBITMQ_ROUTING_KEYS.delivery(departmentCode, jobType);
  const messageTypeMap = {
    submit: RABBITMQ_MESSAGE_TYPES.DEPARTMENT_DELIVERY_REQUESTED,
    status_check: RABBITMQ_MESSAGE_TYPES.DEPARTMENT_STATUS_CHECK_REQUESTED,
    document_push: RABBITMQ_MESSAGE_TYPES.DEPARTMENT_DOCUMENT_PUSH_REQUESTED
  };
  return publishQueueMessage(
    RABBITMQ_EXCHANGES.DELIVERY,
    routingKey,
    {
      messageType: messageTypeMap[jobType] || RABBITMQ_MESSAGE_TYPES.DEPARTMENT_DELIVERY_REQUESTED,
      source: 'us360.adapter-runtime',
      correlationId: context.correlationId,
      causationId: context.causationId,
      idempotencyKey: context.idempotencyKey,
      maxAttempts: context.maxAttempts || Number(process.env.RABBITMQ_RETRY_MAX_ATTEMPTS || 8),
      departmentCode,
      entity: {
        entityType: 'task',
        entityId: payload.taskId || null,
        universalCaseId: payload.universalCaseId || null
      },
      payload: {
        ...payload,
        jobType,
        departmentCode
      },
      metadata: context.metadata || {}
    },
    context
  );
}

async function publishCallbackReconciliationJob(callbackPayload, context = {}) {
  const routingKey = RABBITMQ_ROUTING_KEYS.callback(callbackPayload.departmentCode);
  return publishQueueMessage(
    RABBITMQ_EXCHANGES.CALLBACK,
    routingKey,
    {
      messageType: RABBITMQ_MESSAGE_TYPES.DEPARTMENT_CALLBACK_RECONCILE_REQUESTED,
      source: 'us360.adapter-runtime',
      correlationId: context.correlationId,
      causationId: context.causationId,
      idempotencyKey: context.idempotencyKey,
      departmentCode: callbackPayload.departmentCode,
      entity: {
        entityType: 'task',
        entityId: callbackPayload.taskId || null,
        universalCaseId: callbackPayload.universalCaseId || null
      },
      payload: callbackPayload,
      metadata: context.metadata || {}
    },
    context
  );
}

async function publishRetryMessage(message, delayMs, context = {}) {
  const routingKey = String(message.messageType).includes('callback')
    ? RABBITMQ_ROUTING_KEYS.retryCallback
    : RABBITMQ_ROUTING_KEYS.retryDelivery(message.departmentCode);
  return publishQueueMessage(RABBITMQ_EXCHANGES.RETRY, routingKey, message, {
    ...context,
    expiration: delayMs,
    headers: {
      ...(message.headers || {}),
      'x-retry-count': message.attempt
    }
  });
}

async function publishDeadLetterMessage(message, error, context = {}) {
  const routingKey = context.deadLetterRoutingKey || RABBITMQ_ROUTING_KEYS.deadletterPoison;
  return publishQueueMessage(
    RABBITMQ_EXCHANGES.DEAD_LETTER,
    routingKey,
    {
      ...message,
      messageType: RABBITMQ_MESSAGE_TYPES.QUEUE_DEADLETTERED,
      metadata: {
        ...(message.metadata || {}),
        deadLetter: {
          failedAt: new Date().toISOString(),
          code: error.code || error.name || 'QUEUE_ERROR',
          message: error.message
        }
      }
    },
    context
  );
}

async function publishMonitoringMessage(event, context = {}) {
  return publishQueueMessage(
    RABBITMQ_EXCHANGES.MONITORING,
    event.type,
    {
      messageType: 'queue.monitoring.event.v1',
      source: 'us360.adapter-runtime',
      correlationId: context.correlationId || event.workerId || event.type,
      idempotencyKey: context.idempotencyKey || `${event.type}:${event.workerId || 'system'}:${Date.now()}`,
      routingKey: event.type,
      payload: event,
      metadata: context.metadata || {}
    },
    context
  );
}

module.exports = {
  publishQueueMessage,
  publishDepartmentDeliveryJob,
  publishCallbackReconciliationJob,
  publishRetryMessage,
  publishDeadLetterMessage,
  publishMonitoringMessage
};
