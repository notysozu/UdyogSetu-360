const test = require('node:test');
const assert = require('node:assert/strict');

test('analytics routes module loads', async () => {
  const router = require('../routes/analytics.routes');
  assert.ok(router);
});

test('analytics controller module loads', async () => {
  const controller = require('../controllers/analytics.controller');
  assert.ok(controller.showOverview);
  assert.ok(controller.showReviewPack);
});
