const test = require('node:test');
const assert = require('node:assert/strict');
const { generateUniversalCaseId } = require('../../../packages/shared/src/utils/caseId');

test('generateUniversalCaseId creates prefixed values', () => {
  assert.match(generateUniversalCaseId(), /^US360-\d{8}-[A-Z0-9]{6}$/);
});
