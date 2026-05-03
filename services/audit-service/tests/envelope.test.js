const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEventEnvelope } = require('../../../packages/shared/src/events/envelope');

test('event envelope includes metadata', () => {
  const envelope = buildEventEnvelope({
    type: 'audit.recorded.v1',
    source: 'test',
    subject: 'case-1',
    data: { ok: true }
  });

  assert.equal(envelope.type, 'audit.recorded.v1');
  assert.equal(envelope.subject, 'case-1');
  assert.ok(envelope.id);
});
