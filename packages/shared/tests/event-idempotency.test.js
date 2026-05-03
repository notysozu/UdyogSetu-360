const test = require('node:test');
const assert = require('node:assert/strict');

const { createEventIdempotencyService } = require('../src/kafka/event-idempotency.service');

function createRepository() {
  const rows = [];
  return {
    rows,
    async findOne(filter) {
      return (
        rows.find((row) =>
          Object.entries(filter).every(([key, value]) => row[key] === value)
        ) || null
      );
    },
    async findOneAndUpdate(filter, patch) {
      let row = rows.find((entry) =>
        Object.entries(filter).every(([key, value]) => entry[key] === value)
      );
      if (!row) {
        row = { ...filter };
        rows.push(row);
      }
      Object.assign(row, patch.$set || {});
      row.updatedAt = new Date();
      return row;
    }
  };
}

test('first event processes and duplicate event is skipped', async () => {
  const repository = createRepository();
  const service = createEventIdempotencyService(repository);
  const eventEnvelope = {
    id: 'evt-1',
    type: 'case.submitted.v1',
    correlationid: 'corr-1',
    data: { aggregateType: 'case', aggregateId: 'case-1', universalCaseId: 'US360-KA-1' }
  };

  const first = await service.withIdempotency(
    eventEnvelope,
    'handler',
    'group-1',
    async () => ({ ok: true })
  );
  const second = await service.withIdempotency(
    eventEnvelope,
    'handler',
    'group-1',
    async () => ({ ok: true })
  );

  assert.equal(first.processed, true);
  assert.equal(second.skipped, true);
});
