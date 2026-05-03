const test = require('node:test');
const assert = require('node:assert/strict');

test('department grievance routes module loads', async () => {
  const router = require('../routes/department-grievance.routes');
  assert.ok(router);
});

test('department sla routes module loads', async () => {
  const router = require('../routes/department-sla.routes');
  assert.ok(router);
});
