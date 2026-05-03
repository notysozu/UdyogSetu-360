const { randomUUID } = require('crypto');
const {
  createChannel,
  assertTopology,
  queueMessageEnvelopeSchema,
  QueueValidationError,
  NonRetryableQueueError,
  QueuePoisonMessageError,
  RABBITMQ_MONITORING_EVENTS
} = require('../../../../packages/shared/src');
const queueIdempotencyService = require('../services/queue-idempotency.service');
const queueRetryService = require('../services/queue-retry.service');
const queueJobRepository = require('../repositories/queue-job.repository');
const queueMonitoringService = require('../services/queue-monitoring.service');

function parseQueueMessage(rawMessage) {
  try {
    return JSON.parse(rawMessage.content.toString('utf8'));
  } catch (error) {
    throw new QueueValidationError('Malformed JSON payload.', { code: 'MALFORMED_JSON' });
  }
}

function validateQueueMessage(message) {
  try {
    return queueMessageEnvelopeSchema.parse(message);
  } catch (error) {
    throw new QueueValidationError('Queue message validation failed.', {
      code: 'QUEUE_MESSAGE_VALIDATION_FAILED',
      issues: error.issues || null
    });
  }
}

function ackMessage(channel, rawMessage) {
  channel.ack(rawMessage);
}

function nackMessage(channel, rawMessage, requeue = false) {
  channel.nack(rawMessage, false, requeue);
}

async function publishMonitoringEvent(event) {
  return queueMonitoringService.emitWorkerEvent(event);
}

function createWorker(config = {}) {
  return {
    workerId: config.workerId || randomUUID(),
    workerName: config.workerName || 'queue-worker',
    queueName: config.queueName,
    exchange: config.exchange || null,
    prefetch: Number(config.prefetch || process.env.RABBITMQ_PREFETCH || 10),
    handler: config.handler,
    status: 'created',
    startedAt: null,
    channel: null,
    heartbeatTimer: null
  };
}

async function handleMessage(rawMessage, worker) {
  const workerContext = {
    workerId: worker.workerId,
    workerName: worker.workerName,
    queueName: worker.queueName,
    startedAt: worker.startedAt,
    messageReceivedAt: new Date(),
    deliveryTag: rawMessage.fields.deliveryTag,
    redelivered: rawMessage.fields.redelivered,
    headers: rawMessage.properties.headers || {}
  };

  try {
    const parsed = parseQueueMessage(rawMessage);
    const message = validateQueueMessage(parsed);

    await queueJobRepository.createOrUpdateFromMessage(message, {
      queueName: worker.queueName,
      exchange: worker.exchange,
      originalRoutingKey: message.routingKey
    });

    await publishMonitoringEvent({
      routingKey: RABBITMQ_MONITORING_EVENTS.MESSAGE_RECEIVED,
      workerId: worker.workerId,
      workerName: worker.workerName,
      queueName: worker.queueName,
      correlationId: message.correlationId
    });

    const idempotent = await queueIdempotencyService.withQueueIdempotency(
      message,
      async () => worker.handler(message, workerContext),
      workerContext
    );

    ackMessage(worker.channel, rawMessage);
    await publishMonitoringEvent({
      routingKey: RABBITMQ_MONITORING_EVENTS.MESSAGE_PROCESSED,
      workerId: worker.workerId,
      workerName: worker.workerName,
      queueName: worker.queueName,
      correlationId: message.correlationId,
      status: idempotent.skipped ? 'skipped' : 'processed'
    });
    return idempotent;
  } catch (error) {
    let parsedMessage = null;
    try {
      parsedMessage = rawMessage ? JSON.parse(rawMessage.content.toString('utf8')) : null;
    } catch (_ignore) {
      parsedMessage = null;
    }

    if (!parsedMessage) {
      const syntheticMessage = {
        messageId: `malformed-${rawMessage.fields.deliveryTag}`,
        messageType: 'queue.deadlettered.v1',
        source: 'us360.adapter-runtime',
        correlationId: rawMessage.properties.correlationId || `malformed-${rawMessage.fields.deliveryTag}`,
        idempotencyKey: rawMessage.properties.messageId || `malformed-${rawMessage.fields.deliveryTag}`,
        createdAt: new Date().toISOString(),
        attempt: 0,
        maxAttempts: 1,
        routingKey: 'deadletter.poison',
        payload: {
          raw: rawMessage.content.toString('utf8')
        },
        metadata: {
          reason: 'malformed_json'
        }
      };
      await queueRetryService.sendToDeadLetter(syntheticMessage, error, {
        workerId: worker.workerId,
        queueName: worker.queueName,
        deadLetterRoutingKey: 'deadletter.poison'
      });
      ackMessage(worker.channel, rawMessage);
      return { deadLettered: true };
    }

    const isRetryable = parsedMessage && queueRetryService.shouldRetry(error, parsedMessage);
    const isPoison = parsedMessage && queueRetryService.markPoisonIfNeeded(parsedMessage, error);

    if (error instanceof QueueValidationError || error instanceof NonRetryableQueueError || error instanceof QueuePoisonMessageError || isPoison) {
      await queueRetryService.sendToDeadLetter(parsedMessage, error, {
        workerId: worker.workerId,
        queueName: worker.queueName
      });
      ackMessage(worker.channel, rawMessage);
      await publishMonitoringEvent({
        routingKey: RABBITMQ_MONITORING_EVENTS.MESSAGE_DEADLETTERED,
        workerId: worker.workerId,
        queueName: worker.queueName,
        correlationId: parsedMessage.correlationId,
        status: 'dead_lettered'
      });
      return { deadLettered: true };
    }

    if (isRetryable) {
      await queueRetryService.scheduleRetry(parsedMessage, error, {
        workerId: worker.workerId,
        queueName: worker.queueName,
        originalExchange: worker.exchange
      });
      ackMessage(worker.channel, rawMessage);
      await publishMonitoringEvent({
        routingKey: RABBITMQ_MONITORING_EVENTS.MESSAGE_RETRY_SCHEDULED,
        workerId: worker.workerId,
        queueName: worker.queueName,
        correlationId: parsedMessage.correlationId,
        status: 'retry_scheduled'
      });
      return { retryScheduled: true };
    }

    nackMessage(worker.channel, rawMessage, true);
    await publishMonitoringEvent({
      routingKey: RABBITMQ_MONITORING_EVENTS.MESSAGE_FAILED,
      workerId: worker.workerId,
      queueName: worker.queueName,
      correlationId: parsedMessage.correlationId,
      status: 'nack_requeue'
    });
    return { requeued: true };
  }
}

async function startWorker(worker) {
  worker.channel = await createChannel();
  if (!worker.channel) {
    worker.status = 'disabled';
    return worker;
  }

  await assertTopology(worker.channel);
  await worker.channel.prefetch(worker.prefetch);
  worker.startedAt = new Date();
  worker.status = 'running';
  queueMonitoringService.recordWorkerState(worker);

  await publishMonitoringEvent({
    routingKey: RABBITMQ_MONITORING_EVENTS.WORKER_STARTED,
    workerId: worker.workerId,
    workerName: worker.workerName,
    queueName: worker.queueName,
    startedAt: worker.startedAt
  });

  worker.heartbeatTimer = setInterval(() => {
    publishMonitoringEvent({
      routingKey: RABBITMQ_MONITORING_EVENTS.WORKER_HEARTBEAT,
      workerId: worker.workerId,
      workerName: worker.workerName,
      queueName: worker.queueName,
      startedAt: worker.startedAt,
      status: worker.status
    }).catch(() => {});
  }, 30000);

  await worker.channel.consume(worker.queueName, (rawMessage) => {
    if (!rawMessage) return;
    handleMessage(rawMessage, worker).catch(() => {});
  });

  return worker;
}

async function stopWorker(worker) {
  worker.status = 'stopped';
  if (worker.heartbeatTimer) {
    clearInterval(worker.heartbeatTimer);
    worker.heartbeatTimer = null;
  }
  if (worker.channel) {
    await worker.channel.close().catch(() => {});
    worker.channel = null;
  }
  await publishMonitoringEvent({
    routingKey: RABBITMQ_MONITORING_EVENTS.WORKER_STOPPED,
    workerId: worker.workerId,
    workerName: worker.workerName,
    queueName: worker.queueName,
    startedAt: worker.startedAt,
    status: worker.status
  });
}

module.exports = {
  createWorker,
  startWorker,
  stopWorker,
  handleMessage,
  parseQueueMessage,
  validateQueueMessage,
  ackMessage,
  nackMessage,
  publishMonitoringEvent
};
