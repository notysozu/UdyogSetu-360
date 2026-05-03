const test = require('node:test');
const assert = require('node:assert/strict');
const router = require('../src/routes/adapter.routes');

test('adapter router exposes health and submit endpoints', () => {
  const paths = router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);

  assert.ok(paths.includes('/api/v1/adapters'));
  assert.ok(paths.includes('/api/v1/adapters/health'));
  assert.ok(paths.includes('/api/v1/adapters/:departmentCode/submit'));
});
