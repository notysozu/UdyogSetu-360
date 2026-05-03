const test = require('node:test');
const assert = require('node:assert/strict');
const dashboardService = require('../src/services/department-dashboard.service');
const taskViewService = require('../src/services/department-task-view.service');

const officerUser = {
  id: 'dept-officer-1',
  role: 'department_officer',
  primaryRole: 'department_officer',
  departmentCode: 'pollution'
};

test('officer dashboard returns summary shape for mock data', async () => {
  process.env.USE_MOCK_DEPARTMENT_DATA = 'true';
  const dashboard = await dashboardService.getOfficerDashboard(officerUser, {});
  assert.equal(typeof dashboard.assignedTasks, 'number');
  assert.ok(Array.isArray(dashboard.inbox));
});

test('officer cannot access another department task in task detail', async () => {
  process.env.USE_MOCK_DEPARTMENT_DATA = 'true';
  await assert.rejects(
    taskViewService.getTaskDetail(officerUser, 'mock-task-3', {}),
    /Access denied/
  );
});
