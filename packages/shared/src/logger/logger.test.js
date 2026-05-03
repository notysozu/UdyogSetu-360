const test = require('node:test');
const assert = require('node:assert/strict');
const { createLogger, redactSensitive } = require('./index');

test('structured logger can be created', () => {
  const logger = createLogger('test-service');
  assert.equal(typeof logger.info, 'function');
  assert.equal(typeof logger.child, 'function');
});

test('redaction hides sensitive fields', () => {
  const redacted = redactSensitive({ password: 'secret', token: 'abc', ok: 'yes' });
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.token, '[REDACTED]');
  assert.equal(redacted.ok, 'yes');
});
