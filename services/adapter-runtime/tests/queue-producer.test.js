const test = require('node:test');
const assert = require('node:assert/strict');

process.env.RABBITMQ_ENABLED = 'false';

const { publishQueueMessage } = require('../src/producers/queue-producer');

test('queue producer handles rabbitmq disabled mode', async () => {
  const result = await publishQueueMessage('us360.department.delivery', 'delivery.pollution.submit', {
    messageType: 'department.delivery.requested.v1',
    source: 'us360.adapter-runtime',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    createdAt: new Date().toISOString(),
    attempt: 0,
    maxAttempts: 8,
    departmentCode: 'pollution',
    payload: { jobType: 'submit' }
  });

  assert.equal(result.disabled, true);
});
