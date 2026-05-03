const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransition } = require('../src/state-machines/case-lifecycle');

test('draft can transition to submitted', () => {
  assert.equal(canTransition('draft', 'submitted'), true);
});

test('submitted cannot transition directly to closed', () => {
  assert.equal(canTransition('submitted', 'closed'), false);
});
