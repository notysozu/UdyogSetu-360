const { getTaskInbox, getTaskTimeline } = require('./department-task-view.service');
const supervisorService = require('./supervisor-workflow.service');
const nodalService = require('./nodal-coordination.service');

async function getOfficerDashboard(user) {
  const tasks = await getTaskInbox(user, {});
  return {
    assignedTasks: tasks.length,
    pendingScrutiny: tasks.filter((item) => ['assigned', 'under_review'].includes(item.status)).length,
    waitingQueries: tasks.filter((item) => item.status === 'query_raised').length,
    inspectionsScheduled: tasks.filter((item) => item.status === 'inspection_scheduled').length,
    feeDemandsPending: tasks.filter((item) => item.status === 'fee_demanded').length,
    slaWarnings: tasks.filter((item) => item.dueAt && new Date(item.dueAt).getTime() - Date.now() < 24 * 3600000).length,
    slaBreaches: tasks.filter((item) => item.dueAt && new Date(item.dueAt) < new Date()).length,
    inbox: tasks.slice(0, 10)
  };
}

async function getSupervisorDashboard(user) {
  const [workload, officerWorkload, tasks] = await Promise.all([
    supervisorService.getDepartmentWorkload(user),
    supervisorService.getOfficerWorkload(user),
    getTaskInbox(user, {})
  ]);
  return {
    workload,
    officerWorkload,
    unassignedTasks: tasks.filter((item) => !item.assignedOfficerId).length,
    overdueTasks: tasks.filter((item) => item.dueAt && new Date(item.dueAt) < new Date()).length,
    approvalRecommendationsPending: tasks.filter((item) => item.status === 'under_review').length
  };
}

async function getNodalDashboard(user) {
  const cases = await nodalService.getCrossDepartmentCases(user);
  return {
    activeCases: cases.length,
    delayedCases: cases.filter((item) => item.overdueCount > 0).length,
    cases
  };
}

async function getAuditorDashboard(user) {
  const tasks = await getTaskInbox({ ...user, primaryRole: 'auditor' }, {});
  return {
    taskCount: tasks.length,
    overdueCount: tasks.filter((item) => item.dueAt && new Date(item.dueAt) < new Date()).length,
    recentTasks: tasks.slice(0, 10)
  };
}

module.exports = {
  getOfficerDashboard,
  getSupervisorDashboard,
  getNodalDashboard,
  getAuditorDashboard
};
