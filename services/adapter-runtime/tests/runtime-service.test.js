const test = require('node:test');
const assert = require('node:assert/strict');
const adapterRuntimeService = require('../src/services/adapter-runtime.service');

test('runtime service exports submitToDepartment and health helpers', () => {
  assert.equal(typeof adapterRuntimeService.submitToDepartment, 'function');
  assert.equal(typeof adapterRuntimeService.processDepartmentCallback, 'function');
  assert.equal(typeof adapterRuntimeService.getAdapterHealth, 'function');
  assert.equal(typeof adapterRuntimeService.reloadAdapter, 'function');
});
