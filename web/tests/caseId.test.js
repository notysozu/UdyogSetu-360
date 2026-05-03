const test = require('node:test');
const assert = require('node:assert/strict');
const { generateCaseId } = require('../src/utils/caseId');

test('generateCaseId creates stable prefix and five digit suffix', () => {
  const id = generateCaseId(new Date('2026-05-01T00:00:00Z'), () => 0.12345);
  assert.match(id, /^US360-20260501-\d{5}$/);
});
