const test = require('node:test');
const assert = require('node:assert/strict');
const { parseQueueMessage } = require('../src/workers/worker-runner');
const { QueueValidationError } = require('../../../packages/shared/src');

test('worker parser throws for malformed json', () => {
  assert.throws(
    () =>
      parseQueueMessage({
        content: Buffer.from('{bad json')
      }),
    QueueValidationError
  );
});
