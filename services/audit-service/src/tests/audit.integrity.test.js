const test = require('node:test');
const assert = require('node:assert/strict');
const hashService = require('../services/audit-hash.service');

test('computeAuditHash returns deterministic hash', () => {
  const payload = hashService.canonicaliseAuditPayload({
    eventId: 'e1',
    auditSequence: 1,
    action: 'test.action',
    resourceType: 'test',
    resourceId: '1'
  });
  const first = hashService.computeAuditHash(payload, null);
  const second = hashService.computeAuditHash(payload, null);
  assert.equal(first, second);
});
