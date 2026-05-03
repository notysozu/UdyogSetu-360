const test = require('node:test');
const assert = require('node:assert/strict');
const { BaseDepartmentAdapter } = require('../src/adapters/base/BaseDepartmentAdapter');
const { AdapterMethodNotImplementedError, AdapterValidationError } = require('../src/errors/adapter.errors');

test('unsupported method throws AdapterMethodNotImplementedError', async () => {
  const adapter = new BaseDepartmentAdapter({
    adapterCode: 'base-test',
    departmentCode: 'pollution',
    adapterType: 'rest_api',
    capabilities: []
  });

  await assert.rejects(() => adapter.submitApplication({}, {}), AdapterMethodNotImplementedError);
});

test('supports(capability) reports configured capability', () => {
  const adapter = new BaseDepartmentAdapter({
    adapterCode: 'base-test',
    departmentCode: 'pollution',
    adapterType: 'rest_api',
    capabilities: ['submit_application']
  });

  assert.equal(adapter.supports('submit_application'), true);
  assert.equal(adapter.supports('status_check'), false);
});

test('validateConfig fails on missing departmentCode', () => {
  const adapter = new BaseDepartmentAdapter({
    adapterCode: 'base-test',
    adapterType: 'rest_api'
  });

  assert.throws(() => adapter.validateConfig(), AdapterValidationError);
});
