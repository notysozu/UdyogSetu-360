const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBackoffDelay, shouldRetry } = require('../src/services/queue-retry.service');

test('backoff increases by attempt and is capped', () => {
  const first = calculateBackoffDelay(0, { baseDelayMs: 1000, maxDelayMs: 5000, jitterMs: 0 });
  const second = calculateBackoffDelay(1, { baseDelayMs: 1000, maxDelayMs: 5000, jitterMs: 0 });
  const capped = calculateBackoffDelay(10, { baseDelayMs: 1000, maxDelayMs: 5000, jitterMs: 0 });

  assert.equal(first, 1000);
  assert.equal(second, 2000);
  assert.equal(capped, 5000);
});

test('retry decision stops at max attempts', () => {
  assert.equal(shouldRetry({ retryable: true }, { attempt: 1, maxAttempts: 2 }), true);
  assert.equal(shouldRetry({ retryable: true }, { attempt: 2, maxAttempts: 2 }), false);
  assert.equal(shouldRetry({ retryable: false }, { attempt: 0, maxAttempts: 2 }), false);
});
