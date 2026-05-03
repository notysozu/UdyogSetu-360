const test = require('node:test');
const assert = require('node:assert/strict');
const adapterRegistry = require('../src/services/adapter-registry');
const { BaseDepartmentAdapter } = require('../src/adapters/base/BaseDepartmentAdapter');
const { createAdapterForDepartment } = require('../src/services/adapter-factory');

class SampleAdapter extends BaseDepartmentAdapter {}
SampleAdapter.adapterCode = 'sample_mock_v1';
SampleAdapter.departmentCode = 'pollution';

test('register adapter and resolve by department', () => {
  adapterRegistry.clearRegistry();
  adapterRegistry.registerAdapter(SampleAdapter);
  assert.equal(adapterRegistry.hasAdapter('pollution'), true);
  assert.equal(adapterRegistry.getAdapterByDepartment('pollution'), SampleAdapter);
});

test('createAdapterForDepartment loads active pollution mock adapter', async () => {
  const adapter = await createAdapterForDepartment('pollution', { correlationId: 'test-corr' });
  assert.equal(adapter.departmentCode, 'pollution');
  assert.equal(adapter.adapterCode, 'pollution_mock_v1');
});
