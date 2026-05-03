const QueueJob = require('../models/QueueJob');
const {
  RABBITMQ_QUEUE_STATUSES,
  RABBITMQ_MONITORING_EVENTS,
  getRabbitConfig,
  getRabbitHealth
} = require('../../../../packages/shared/src');

const workerState = new Map();

function recordWorkerState(worker) {
  workerState.set(worker.workerId, {
    workerId: worker.workerId,
    workerName: worker.workerName,
    queueName: worker.queueName,
    status: worker.status || 'starting',
    heartbeatAt: new Date(),
    startedAt: worker.startedAt || new Date()
  });
}

function getWorkerStats() {
  return Array.from(workerState.values()).map((entry) => ({
    ...entry,
    heartbeatAgeMs: Date.now() - new Date(entry.heartbeatAt).getTime()
  }));
}

async function getDeadLetterStats() {
  const [delivery, callback, oldest] = await Promise.all([
    QueueJob.countDocuments({ status: RABBITMQ_QUEUE_STATUSES.DEAD_LETTERED, messageType: /delivery/, isDeleted: false }),
    QueueJob.countDocuments({ status: RABBITMQ_QUEUE_STATUSES.DEAD_LETTERED, messageType: /callback/, isDeleted: false }),
    QueueJob.findOne({ status: RABBITMQ_QUEUE_STATUSES.DEAD_LETTERED, isDeleted: false }).sort({ deadLetteredAt: 1 }).lean()
  ]);

  return {
    delivery,
    callback,
    total: delivery + callback,
    oldestDeadLetterAgeMs: oldest?.deadLetteredAt ? Date.now() - new Date(oldest.deadLetteredAt).getTime() : null
  };
}

async function getRetryStats() {
  const queued = await QueueJob.countDocuments({
    status: RABBITMQ_QUEUE_STATUSES.RETRY_SCHEDULED,
    isDeleted: false
  });
  return { retryScheduled: queued };
}

async function getQueueStats() {
  const [queued, processing, succeeded, failed, deadLettered] = await Promise.all([
    QueueJob.countDocuments({ status: RABBITMQ_QUEUE_STATUSES.QUEUED, isDeleted: false }),
    QueueJob.countDocuments({ status: RABBITMQ_QUEUE_STATUSES.PROCESSING, isDeleted: false }),
    QueueJob.countDocuments({ status: RABBITMQ_QUEUE_STATUSES.SUCCEEDED, isDeleted: false }),
    QueueJob.countDocuments({ status: RABBITMQ_QUEUE_STATUSES.FAILED, isDeleted: false }),
    QueueJob.countDocuments({ status: RABBITMQ_QUEUE_STATUSES.DEAD_LETTERED, isDeleted: false })
  ]);

  return {
    readyMessages: queued,
    unackedMessages: processing,
    succeeded,
    failed,
    deadLettered,
    consumers: getWorkerStats().length,
    source: 'mongodb_fallback'
  };
}

async function emitWorkerEvent(event) {
  const { publishMonitoringMessage } = require('../producers/queue-producer');
  const routingKey = event.routingKey || RABBITMQ_MONITORING_EVENTS.MESSAGE_PROCESSED;
  if (event.workerId) {
    recordWorkerState({
      workerId: event.workerId,
      workerName: event.workerName,
      queueName: event.queueName,
      status: event.status || routingKey,
      startedAt: event.startedAt
    });
  }
  return publishMonitoringMessage(
    {
      type: routingKey,
      ...event
    },
    { correlationId: event.correlationId || event.workerId || 'queue-monitoring' }
  );
}

async function checkDepthWarnings(threshold = 100) {
  const stats = await getQueueStats();
  if (stats.readyMessages >= threshold) {
    await emitWorkerEvent({
      routingKey: RABBITMQ_MONITORING_EVENTS.QUEUE_DEPTH_WARNING,
      status: 'warning',
      details: stats
    });
  }
  return stats.readyMessages >= threshold;
}

async function buildQueueHealthReport() {
  const rabbit = getRabbitHealth();
  const [queues, deadLetter, retry, workers] = await Promise.all([
    getQueueStats(),
    getDeadLetterStats(),
    getRetryStats(),
    Promise.resolve(getWorkerStats())
  ]);

  return {
    rabbitmq: rabbit.status,
    queues: rabbit.status === 'degraded' ? 'degraded' : 'ok',
    config: {
      enabled: getRabbitConfig().enabled
    },
    stats: {
      queues,
      deadLetter,
      retry,
      workers
    }
  };
}

module.exports = {
  recordWorkerState,
  getQueueStats,
  getWorkerStats,
  getDeadLetterStats,
  getRetryStats,
  emitWorkerEvent,
  checkDepthWarnings,
  buildQueueHealthReport
};
