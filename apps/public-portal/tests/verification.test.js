const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../src/services/public-verification.service');

test('sample token verifies in development-safe mock mode', async () => {
  const result = await service.verifyByToken('DEV-VERIFY-TOKEN-000001', {
    correlationId: 'test-correlation',
    ipAddress: '127.0.0.1',
    userAgent: 'node-test'
  });
  assert.equal(result.verified, true);
  assert.equal(result.status, 'valid');
});

test('unknown certificate returns not_found without private fields', async () => {
  const result = await service.verifyCertificate(
    { certificateNumber: 'CERT-NOT-FOUND', universalCaseId: 'US360-KA-2026-000001' },
    { correlationId: 'test-correlation', ipAddress: '127.0.0.1', userAgent: 'node-test' }
  );
  assert.equal(result.status === 'not_found' || result.status === 'invalid', true);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'documentObjectKey'), false);
});
