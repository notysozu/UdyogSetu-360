const test = require('node:test');
const assert = require('node:assert/strict');
const {
  signPayload,
  verifyHmacSignature,
  verifyTimestamp
} = require('../src/signatures/signature-validator');
const { AdapterSignatureError } = require('../src/errors/adapter.errors');

test('HMAC signature verifies', () => {
  const payload = JSON.stringify({ ok: true });
  const signature = signPayload(payload, 'secret', { algorithm: 'hmac-sha256' });
  assert.equal(verifyHmacSignature(payload, signature, 'secret', { algorithm: 'hmac-sha256' }), true);
});

test('invalid signature rejected', () => {
  const payload = JSON.stringify({ ok: true });
  assert.equal(verifyHmacSignature(payload, 'bad-signature', 'secret', { algorithm: 'hmac-sha256' }), false);
});

test('expired timestamp rejected', () => {
  const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  assert.throws(() => verifyTimestamp(oldTimestamp, 300), AdapterSignatureError);
});
