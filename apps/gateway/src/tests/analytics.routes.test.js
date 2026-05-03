const test = require('node:test');
const assert = require('node:assert/strict');

test('gateway analytics routes module loads', async () => {
  const router = require('../routes/analytics.routes');
  assert.ok(router);
});

test('gateway analytics controller module loads', async () => {
  const controller = require('../controllers/analytics.controller');
  assert.ok(controller.getOverviewApi);
  assert.ok(controller.getReviewPackApi);
});
