const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../src/services/public-metrics.service');
const { validateMetricsFilters } = require('../src/validators/public-metrics.validators');

test('public metrics bundle falls back to non-PII mock data', async () => {
  const bundle = await service.getPublicMetricsBundle({});
  assert.equal(typeof bundle.overview.totalApplicationsReceived, 'number');
  assert.equal(Array.isArray(bundle.departmentTurnaround), true);
});

test('metrics validator rejects oversized date windows', () => {
  const result = validateMetricsFilters({ fromDate: '2024-01-01', toDate: '2026-01-31' });
  assert.equal(result.errors.length > 0, true);
});
