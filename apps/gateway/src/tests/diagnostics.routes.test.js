const test = require('node:test');
const assert = require('node:assert/strict');

test('diagnostics routes module loads', async () => {
  const router = require('../routes/diagnostics.routes');
  assert.ok(router);
});

test('replay routes module loads', async () => {
  const router = require('../routes/replay.routes');
  assert.ok(router);
});
