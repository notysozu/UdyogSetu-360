const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyAdapterError } = require('../src/errors/adapter.errors');

test('timeout classified retryable', () => {
  const error = classifyAdapterError(new Error('timeout'), { status: 504 }, {});
  assert.equal(error.classification, 'timeout');
  assert.equal(error.retryable, true);
});

test('400 classified non-retryable', () => {
  const error = classifyAdapterError(new Error('bad request'), { status: 400 }, {});
  assert.equal(error.classification, 'non_retryable');
  assert.equal(error.retryable, false);
});

test('503 classified retryable', () => {
  const error = classifyAdapterError(new Error('down'), { status: 503 }, {});
  assert.equal(error.classification, 'unavailable');
  assert.equal(error.retryable, true);
});

test('401 classified authentication failure', () => {
  const error = classifyAdapterError(new Error('auth'), { status: 401 }, {});
  assert.equal(error.classification, 'authentication');
});
