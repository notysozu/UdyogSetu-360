const test = require('node:test');
const assert = require('node:assert/strict');
const dashboardService = require('../src/services/investor-dashboard.service');

test('dashboard service returns summary shape for mock data in development', async () => {
  const summary = await dashboardService.getDashboardSummary({
    id: 'user-1',
    name: 'Investor User',
    organisation: 'Setu Manufacturing Private Limited'
  });
  assert.equal(typeof summary.totalCases, 'number');
  assert.equal(typeof summary.pendingActions, 'number');
});
