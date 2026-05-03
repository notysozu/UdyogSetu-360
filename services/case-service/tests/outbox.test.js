const test = require('node:test');
const assert = require('node:assert/strict');

const DomainEvent = require('../src/models/DomainEvent');
const { calculateNextRetry } = require('../src/outbox/outbox-publisher.service');

test('outbox schema supports publish locking and topic metadata', () => {
  const paths = DomainEvent.schema.paths;
  assert.ok(paths.topic);
  assert.ok(paths.partitionKey);
  assert.ok(paths.lockedAt);
  assert.ok(paths.lockedBy);
});

test('retry scheduling returns a future timestamp', () => {
  const retryAt = calculateNextRetry(3);
  assert.ok(retryAt instanceof Date);
  assert.ok(retryAt.getTime() > Date.now());
});
