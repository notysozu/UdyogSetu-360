const test = require('node:test');
const assert = require('node:assert/strict');
const view = require('../src/helpers/view.helpers');
const status = require('../src/helpers/status.helpers');

test('department view helpers format currency and percentages safely', () => {
  assert.equal(view.formatCurrency(1200).includes('1,200'), true);
  assert.equal(view.percentage(4, 5), 80);
});

test('department status helpers expose readable labels and classes', () => {
  assert.equal(status.statusLabel('under_review'), 'Under Review');
  assert.equal(status.statusBadgeClass('approved').includes('success'), true);
});
