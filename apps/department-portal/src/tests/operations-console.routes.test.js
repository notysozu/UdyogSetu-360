const test = require('node:test');
const assert = require('node:assert/strict');

test('operations routes module loads', async () => {
  const router = require('../routes/operations.routes');
  assert.ok(router);
});
