const test = require('node:test');
const assert = require('node:assert/strict');
const view = require('../src/helpers/view.helpers');
const { buildTranslator } = require('../src/helpers/i18n.helpers');

test('view helpers expose readable status labels and percentages', () => {
  assert.equal(view.statusLabel('query_raised'), 'Query Raised');
  assert.equal(view.percentage(3, 4), 75);
});

test('i18n translator falls back safely', () => {
  const t = buildTranslator('kn');
  assert.equal(typeof t('dashboard'), 'string');
  assert.equal(t('unknown.key', 'Fallback'), 'Fallback');
});
