const test = require('node:test');
const assert = require('node:assert/strict');

process.env.KAFKA_ENABLED = 'false';

const { createEventConsumer } = require('../src/kafka/event-consumer');

test('consumer wrapper returns disabled when Kafka is disabled', async () => {
  const consumer = await createEventConsumer({ groupId: 'test-group' });
  assert.equal(consumer, null);
});
