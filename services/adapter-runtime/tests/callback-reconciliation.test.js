const test = require('node:test');
const assert = require('node:assert/strict');
const { mapCallbackToAction } = require('../src/services/callback-reconciliation.service');

test('callback mapping normalizes inspection completed', () => {
  const action = mapCallbackToAction('inspection_completed', 'completed');
  assert.equal(action.method, 'completeInspection');
  assert.equal(action.nextStatus, 'inspection_completed');
});

test('unsupported callback mapping returns null', () => {
  assert.equal(mapCallbackToAction('unknown', 'mystery'), null);
});
