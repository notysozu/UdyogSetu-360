const test = require('node:test');
const assert = require('node:assert/strict');
const {
  RABBITMQ_EXCHANGES,
  RABBITMQ_QUEUE_NAMES,
  RABBITMQ_TOPOLOGY
} = require('../src');

test('rabbitmq topology declares required exchanges', () => {
  const exchangeNames = RABBITMQ_TOPOLOGY.exchanges.map((entry) => entry.name);
  assert.deepEqual(exchangeNames.sort(), Object.values(RABBITMQ_EXCHANGES).sort());
});

test('rabbitmq topology binds callback queue and monitoring queue', () => {
  const bindingKeys = RABBITMQ_TOPOLOGY.bindings.map((entry) => `${entry.queue}:${entry.routingKey}`);
  assert.ok(bindingKeys.includes(`${RABBITMQ_QUEUE_NAMES.callbackReconciliation}:callback.#`));
  assert.ok(bindingKeys.includes(`${RABBITMQ_QUEUE_NAMES.monitoringWorkerEvents}:monitoring.#`));
});
