const test = require('node:test');
const assert = require('node:assert/strict');

process.env.KAFKA_ENABLED = 'false';

const { publishEvent } = require('../src/kafka/event-producer');

test('producer handles Kafka disabled mode', async () => {
  const result = await publishEvent({
    id: 'evt-producer-1',
    source: 'us360.case-service',
    specversion: '1.0',
    type: 'case.submitted.v1',
    subject: 'case/US360-KA-2026-000001',
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    dataschema: 'https://udyogsetu360.local/schemas/case.submitted.v1.json',
    correlationid: 'corr-producer-1',
    partitionkey: 'US360-KA-2026-000001',
    data: {
      eventVersion: 1,
      aggregateType: 'case',
      aggregateId: 'case-1',
      universalCaseId: 'US360-KA-2026-000001',
      payload: {},
      metadata: {}
    }
  });

  assert.equal(result.result.disabled, true);
});
