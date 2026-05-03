const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildEventEnvelope,
  parseEventVersion
} = require('../src/events/event-envelope');

test('buildEventEnvelope creates required fields', () => {
  const eventEnvelope = buildEventEnvelope({
    type: 'case.submitted.v1',
    source: 'us360.case-service',
    subject: 'case/US360-KA-2026-000001',
    correlationid: 'corr-1',
    partitionkey: 'US360-KA-2026-000001',
    aggregateType: 'case',
    aggregateId: 'case-1',
    universalCaseId: 'US360-KA-2026-000001',
    payload: {}
  });

  assert.equal(eventEnvelope.type, 'case.submitted.v1');
  assert.equal(eventEnvelope.specversion, '1.0');
  assert.equal(eventEnvelope.partitionkey, 'US360-KA-2026-000001');
  assert.equal(eventEnvelope.data.aggregateType, 'case');
});

test('invalid event name is rejected and version is parsed correctly', () => {
  assert.equal(parseEventVersion('case.submitted.v1'), 1);
  assert.throws(() =>
    buildEventEnvelope({
      type: 'case.submitted',
      source: 'us360.case-service',
      subject: 'case/1',
      correlationid: 'corr-2',
      partitionkey: '1',
      aggregateType: 'case',
      aggregateId: '1'
    })
  );
});
