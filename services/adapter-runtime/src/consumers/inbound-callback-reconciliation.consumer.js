const {
  RABBITMQ_QUEUE_NAMES,
  RABBITMQ_EXCHANGES
} = require('../../../../packages/shared/src');
const { createWorker, startWorker, stopWorker } = require('../workers/worker-runner');
const { executeCallbackReconciliation } = require('../services/callback-reconciliation.service');

function createCallbackWorker() {
  return createWorker({
    workerName: 'callback-reconciliation',
    queueName: RABBITMQ_QUEUE_NAMES.callbackReconciliation,
    exchange: RABBITMQ_EXCHANGES.CALLBACK,
    prefetch: Number(process.env.RABBITMQ_WORKER_CONCURRENCY || 5),
    handler: (message, context) => executeCallbackReconciliation(message, context)
  });
}

async function startCallbackWorker() {
  const worker = createCallbackWorker();
  await startWorker(worker);
  return worker;
}

module.exports = {
  createCallbackWorker,
  startCallbackWorker,
  stopCallbackWorker: stopWorker
};
