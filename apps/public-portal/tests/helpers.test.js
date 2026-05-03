const test = require('node:test');
const assert = require('node:assert/strict');
const view = require('../src/helpers/view.helpers');

test('public view helpers format verification status and numbers safely', () => {
  assert.equal(view.verificationStatusLabel('valid'), 'Valid');
  assert.equal(view.departmentLabel('fire').includes('Fire'), true);
});
