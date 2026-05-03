const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildQueueMessageEnvelope,
  QueueValidationError
} = require('../src');

test('queue envelope includes required fields', () => {
  const envelope = buildQueueMessageEnvelope({
    messageType: 'department.delivery.requested.v1',
    routingKey: 'delivery.pollution.submit',
    departmentCode: 'pollution',
    payload: { jobType: 'submit' }
  });

  assert.ok(envelope.messageId);
  assert.equal(envelope.departmentCode, 'pollution');
  assert.equal(envelope.routingKey, 'delivery.pollution.submit');
  assert.equal(envelope.attempt, 0);
});

test('queue envelope rejects invalid department code', () => {
  assert.throws(
    () =>
      buildQueueMessageEnvelope({
        messageType: 'department.delivery.requested.v1',
        routingKey: 'delivery.pollution.submit',
        departmentCode: 'invalid',
        payload: {}
      }),
    QueueValidationError
  );
});
