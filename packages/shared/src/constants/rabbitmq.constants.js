const { DEPARTMENT_CODE_VALUES } = require('./department.constants');

const RABBITMQ_EXCHANGES = Object.freeze({
  DELIVERY: 'us360.department.delivery',
  CALLBACK: 'us360.department.callback',
  RETRY: 'us360.retry',
  DEAD_LETTER: 'us360.deadletter',
  MONITORING: 'us360.monitoring'
});

const RABBITMQ_EXCHANGE_TYPES = Object.freeze({
  TOPIC: 'topic'
});

const RABBITMQ_MESSAGE_TYPES = Object.freeze({
  DEPARTMENT_DELIVERY_REQUESTED: 'department.delivery.requested.v1',
  DEPARTMENT_STATUS_CHECK_REQUESTED: 'department.status_check.requested.v1',
  DEPARTMENT_DOCUMENT_PUSH_REQUESTED: 'department.document_push.requested.v1',
  DEPARTMENT_CALLBACK_RECEIVED: 'department.callback.received.v1',
  DEPARTMENT_CALLBACK_RECONCILE_REQUESTED: 'department.callback.reconcile_requested.v1',
  QUEUE_RETRY_SCHEDULED: 'queue.retry_scheduled.v1',
  QUEUE_DEADLETTERED: 'queue.deadlettered.v1'
});

const RABBITMQ_DELIVERY_JOB_TYPES = Object.freeze({
  SUBMIT: 'submit',
  STATUS_CHECK: 'status_check',
  DOCUMENT_PUSH: 'document_push'
});

const RABBITMQ_QUEUE_STATUSES = Object.freeze({
  QUEUED: 'queued',
  PROCESSING: 'processing',
  RETRY_SCHEDULED: 'retry_scheduled',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  DEAD_LETTERED: 'dead_lettered',
  CANCELLED: 'cancelled'
});

const RABBITMQ_MONITORING_EVENTS = Object.freeze({
  WORKER_STARTED: 'monitoring.worker.started',
  WORKER_STOPPED: 'monitoring.worker.stopped',
  WORKER_HEARTBEAT: 'monitoring.worker.heartbeat',
  MESSAGE_RECEIVED: 'monitoring.message.received',
  MESSAGE_PROCESSED: 'monitoring.message.processed',
  MESSAGE_FAILED: 'monitoring.message.failed',
  MESSAGE_RETRY_SCHEDULED: 'monitoring.message.retry_scheduled',
  MESSAGE_DEADLETTERED: 'monitoring.message.deadlettered',
  QUEUE_DEPTH_WARNING: 'monitoring.queue.depth_warning'
});

const RABBITMQ_ROUTING_KEYS = Object.freeze({
  delivery(departmentCode, jobType) {
    return `delivery.${departmentCode}.${jobType}`;
  },
  callback(departmentCode = 'department') {
    return `callback.${departmentCode}.received`;
  },
  retryDelivery(departmentCode) {
    return `retry.delivery.${departmentCode}`;
  },
  retryCallback: 'retry.callback.reconciliation',
  deadletterDelivery: 'deadletter.delivery',
  deadletterCallback: 'deadletter.callback',
  deadletterPoison: 'deadletter.poison'
});

const RABBITMQ_QUEUE_NAMES = Object.freeze({
  delivery(departmentCode) {
    return `us360.delivery.${departmentCode}.q`;
  },
  deliveryRetry(departmentCode) {
    return `us360.delivery.${departmentCode}.retry.q`;
  },
  deliveryDeadLetter: 'us360.delivery.deadletter.q',
  callbackReconciliation: 'us360.callback.reconciliation.q',
  callbackReconciliationRetry: 'us360.callback.reconciliation.retry.q',
  callbackDeadLetter: 'us360.callback.deadletter.q',
  monitoringWorkerEvents: 'us360.monitoring.worker-events.q'
});

const RABBITMQ_ALLOWED_DELIVERY_ROUTING_KEYS = Object.freeze(
  DEPARTMENT_CODE_VALUES.flatMap((departmentCode) =>
    Object.values(RABBITMQ_DELIVERY_JOB_TYPES).map((jobType) =>
      RABBITMQ_ROUTING_KEYS.delivery(departmentCode, jobType)
    )
  )
);

const RABBITMQ_ALLOWED_CALLBACK_ROUTING_KEYS = Object.freeze([
  RABBITMQ_ROUTING_KEYS.callback(),
  ...DEPARTMENT_CODE_VALUES.map((departmentCode) => RABBITMQ_ROUTING_KEYS.callback(departmentCode)),
  'callback.n8n.received'
]);

const RABBITMQ_ALLOWED_RETRY_ROUTING_KEYS = Object.freeze([
  ...DEPARTMENT_CODE_VALUES.map((departmentCode) => RABBITMQ_ROUTING_KEYS.retryDelivery(departmentCode)),
  RABBITMQ_ROUTING_KEYS.retryCallback
]);

const RABBITMQ_ALLOWED_DEADLETTER_ROUTING_KEYS = Object.freeze([
  RABBITMQ_ROUTING_KEYS.deadletterDelivery,
  RABBITMQ_ROUTING_KEYS.deadletterCallback,
  RABBITMQ_ROUTING_KEYS.deadletterPoison
]);

const RABBITMQ_ALLOWED_MONITORING_ROUTING_KEYS = Object.freeze(
  Object.values(RABBITMQ_MONITORING_EVENTS)
);

const RABBITMQ_ALLOWED_ROUTING_KEYS = Object.freeze([
  ...RABBITMQ_ALLOWED_DELIVERY_ROUTING_KEYS,
  ...RABBITMQ_ALLOWED_CALLBACK_ROUTING_KEYS,
  ...RABBITMQ_ALLOWED_RETRY_ROUTING_KEYS,
  ...RABBITMQ_ALLOWED_DEADLETTER_ROUTING_KEYS,
  ...RABBITMQ_ALLOWED_MONITORING_ROUTING_KEYS
]);

const RABBITMQ_TOPOLOGY = Object.freeze({
  exchanges: [
    { name: RABBITMQ_EXCHANGES.DELIVERY, type: RABBITMQ_EXCHANGE_TYPES.TOPIC, options: { durable: true } },
    { name: RABBITMQ_EXCHANGES.CALLBACK, type: RABBITMQ_EXCHANGE_TYPES.TOPIC, options: { durable: true } },
    { name: RABBITMQ_EXCHANGES.RETRY, type: RABBITMQ_EXCHANGE_TYPES.TOPIC, options: { durable: true } },
    { name: RABBITMQ_EXCHANGES.DEAD_LETTER, type: RABBITMQ_EXCHANGE_TYPES.TOPIC, options: { durable: true } },
    { name: RABBITMQ_EXCHANGES.MONITORING, type: RABBITMQ_EXCHANGE_TYPES.TOPIC, options: { durable: true } }
  ],
  buildQueues(config = {}) {
    const retryTtl = Number(config.retryBaseDelayMs || process.env.RABBITMQ_RETRY_BASE_DELAY_MS || 5000);

    return [
      ...DEPARTMENT_CODE_VALUES.map((departmentCode) => ({
        name: RABBITMQ_QUEUE_NAMES.delivery(departmentCode),
        options: {
          durable: true,
          deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
          deadLetterRoutingKey: RABBITMQ_ROUTING_KEYS.deadletterDelivery
        }
      })),
      ...DEPARTMENT_CODE_VALUES.map((departmentCode) => ({
        name: RABBITMQ_QUEUE_NAMES.deliveryRetry(departmentCode),
        options: {
          durable: true,
          messageTtl: retryTtl,
          deadLetterExchange: RABBITMQ_EXCHANGES.DELIVERY,
          deadLetterRoutingKey: RABBITMQ_ROUTING_KEYS.delivery(departmentCode, RABBITMQ_DELIVERY_JOB_TYPES.SUBMIT)
        }
      })),
      {
        name: RABBITMQ_QUEUE_NAMES.deliveryDeadLetter,
        options: { durable: true }
      },
      {
        name: RABBITMQ_QUEUE_NAMES.callbackReconciliation,
        options: {
          durable: true,
          deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
          deadLetterRoutingKey: RABBITMQ_ROUTING_KEYS.deadletterCallback
        }
      },
      {
        name: RABBITMQ_QUEUE_NAMES.callbackReconciliationRetry,
        options: {
          durable: true,
          messageTtl: retryTtl,
          deadLetterExchange: RABBITMQ_EXCHANGES.CALLBACK,
          deadLetterRoutingKey: RABBITMQ_ROUTING_KEYS.callback()
        }
      },
      {
        name: RABBITMQ_QUEUE_NAMES.callbackDeadLetter,
        options: { durable: true }
      },
      {
        name: RABBITMQ_QUEUE_NAMES.monitoringWorkerEvents,
        options: { durable: true }
      }
    ];
  },
  bindings: [
    ...DEPARTMENT_CODE_VALUES.flatMap((departmentCode) =>
      Object.values(RABBITMQ_DELIVERY_JOB_TYPES).map((jobType) => ({
        exchange: RABBITMQ_EXCHANGES.DELIVERY,
        queue: RABBITMQ_QUEUE_NAMES.delivery(departmentCode),
        routingKey: RABBITMQ_ROUTING_KEYS.delivery(departmentCode, jobType)
      }))
    ),
    ...DEPARTMENT_CODE_VALUES.map((departmentCode) => ({
      exchange: RABBITMQ_EXCHANGES.RETRY,
      queue: RABBITMQ_QUEUE_NAMES.deliveryRetry(departmentCode),
      routingKey: RABBITMQ_ROUTING_KEYS.retryDelivery(departmentCode)
    })),
    {
      exchange: RABBITMQ_EXCHANGES.CALLBACK,
      queue: RABBITMQ_QUEUE_NAMES.callbackReconciliation,
      routingKey: 'callback.#'
    },
    {
      exchange: RABBITMQ_EXCHANGES.RETRY,
      queue: RABBITMQ_QUEUE_NAMES.callbackReconciliationRetry,
      routingKey: RABBITMQ_ROUTING_KEYS.retryCallback
    },
    {
      exchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
      queue: RABBITMQ_QUEUE_NAMES.deliveryDeadLetter,
      routingKey: RABBITMQ_ROUTING_KEYS.deadletterDelivery
    },
    {
      exchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
      queue: RABBITMQ_QUEUE_NAMES.callbackDeadLetter,
      routingKey: RABBITMQ_ROUTING_KEYS.deadletterCallback
    },
    {
      exchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
      queue: RABBITMQ_QUEUE_NAMES.callbackDeadLetter,
      routingKey: RABBITMQ_ROUTING_KEYS.deadletterPoison
    },
    {
      exchange: RABBITMQ_EXCHANGES.MONITORING,
      queue: RABBITMQ_QUEUE_NAMES.monitoringWorkerEvents,
      routingKey: 'monitoring.#'
    }
  ]
});

module.exports = {
  RABBITMQ_EXCHANGES,
  RABBITMQ_EXCHANGE_TYPES,
  RABBITMQ_MESSAGE_TYPES,
  RABBITMQ_DELIVERY_JOB_TYPES,
  RABBITMQ_QUEUE_STATUSES,
  RABBITMQ_MONITORING_EVENTS,
  RABBITMQ_ROUTING_KEYS,
  RABBITMQ_QUEUE_NAMES,
  RABBITMQ_ALLOWED_DELIVERY_ROUTING_KEYS,
  RABBITMQ_ALLOWED_CALLBACK_ROUTING_KEYS,
  RABBITMQ_ALLOWED_RETRY_ROUTING_KEYS,
  RABBITMQ_ALLOWED_DEADLETTER_ROUTING_KEYS,
  RABBITMQ_ALLOWED_MONITORING_ROUTING_KEYS,
  RABBITMQ_ALLOWED_ROUTING_KEYS,
  RABBITMQ_TOPOLOGY
};
