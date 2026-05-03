const {
  RABBITMQ_QUEUE_NAMES,
  RABBITMQ_EXCHANGES
} = require('../../../../packages/shared/src');
const { createWorker, startWorker, stopWorker } = require('../workers/worker-runner');
const { executeOutboundDelivery } = require('../services/outbound-delivery.service');

function createOutboundDepartmentWorker(departmentCode) {
  return createWorker({
    workerName: `outbound-${departmentCode}`,
    queueName: RABBITMQ_QUEUE_NAMES.delivery(departmentCode),
    exchange: RABBITMQ_EXCHANGES.DELIVERY,
    prefetch: Number(process.env.RABBITMQ_WORKER_CONCURRENCY || 5),
    handler: (message, context) => executeOutboundDelivery(message, context)
  });
}

async function startOutboundDepartmentWorker(departmentCode) {
  const worker = createOutboundDepartmentWorker(departmentCode);
  await startWorker(worker);
  return worker;
}

module.exports = {
  createOutboundDepartmentWorker,
  startOutboundDepartmentWorker,
  stopOutboundDepartmentWorker: stopWorker
};
