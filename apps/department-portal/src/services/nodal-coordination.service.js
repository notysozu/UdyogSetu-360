const { getTaskInbox, getCaseCoordinationView } = require('./department-task-view.service');
const { emitAndAudit } = require('./department-action-event.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const commentService = require('./department-comment.service');

async function getCrossDepartmentCases(user) {
  const tasks = await getTaskInbox({ ...user, departmentCode: null, primaryRole: 'nodal_officer' }, {});
  const cases = {};
  tasks.forEach((task) => {
    const key = task.universalCaseId;
    if (!cases[key]) {
      cases[key] = {
        universalCaseId: task.universalCaseId,
        taskCount: 0,
        overdueCount: 0,
        departments: new Set()
      };
    }
    cases[key].taskCount += 1;
    cases[key].departments.add(task.departmentCode);
    if (task.dueAt && new Date(task.dueAt) < new Date()) cases[key].overdueCount += 1;
  });
  return Object.values(cases).map((item) => ({ ...item, departments: Array.from(item.departments) }));
}

function getCaseCoordinationViewWrapper(caseId, context = {}) {
  return getCaseCoordinationView(context.user, caseId);
}

async function escalateCase(caseId, input, context = {}) {
  await emitAndAudit(EVENT_NAMES.SLA_ESCALATED, 'sla.escalated', {
    resourceType: 'case',
    resourceId: String(caseId),
    caseId,
    universalCaseId: input.universalCaseId || String(caseId),
    departmentCode: input.departmentCode || null,
    reason: input.reason
  }, {
    aggregateType: 'case',
    resourceId: String(caseId),
    caseId: String(caseId),
    universalCaseId: input.universalCaseId || String(caseId),
    reason: input.reason
  }, context);
  return { success: true };
}

async function requestDepartmentAction(taskId, input, context = {}) {
  return commentService.addTaskComment(taskId, {
    caseId: input.caseId,
    universalCaseId: input.universalCaseId,
    body: input.body,
    visibility: 'nodal_visible'
  }, context);
}

async function addNodalComment(caseId, input, context = {}) {
  return commentService.addCaseComment(caseId, {
    universalCaseId: input.universalCaseId,
    body: input.body,
    visibility: 'nodal_visible'
  }, context);
}

module.exports = {
  getCrossDepartmentCases,
  getCaseCoordinationView: getCaseCoordinationViewWrapper,
  escalateCase,
  requestDepartmentAction,
  addNodalComment
};
