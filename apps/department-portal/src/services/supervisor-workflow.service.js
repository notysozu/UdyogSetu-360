const ApprovalTask = require('../../../../services/case-service/src/models/ApprovalTask');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const taskLifecycle = require('../../../../services/orchestration-service/src/services/task-lifecycle.service');
const { emitAndAudit } = require('./department-action-event.service');
const { getTaskInbox, getTaskDetail, useMockData } = require('./department-task-view.service');

async function assignTask(taskId, officerId, context = {}) {
  const task = await getTaskDetail(context.user, taskId);
  if (!task) throw Object.assign(new Error('Task not found.'), { status: 404 });
  let updated = task;
  if (!useMockData()) {
    updated = await ApprovalTask.findByIdAndUpdate(task._id, { $set: { assignedOfficerId: officerId } }, { new: true });
    await taskLifecycle.assignTask(task._id, officerId, context);
  }
  await emitAndAudit(EVENT_NAMES.TASK_ASSIGNED, 'task.assigned', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId,
    officerId
  }, context);
  return updated;
}

async function reassignTask(taskId, officerId, reason, context = {}) {
  return assignTask(taskId, officerId, { ...context, overrideReason: reason || context.overrideReason });
}

async function escalateTask(taskId, reason, context = {}) {
  const task = await getTaskDetail(context.user, taskId);
  await emitAndAudit(EVENT_NAMES.SLA_ESCALATED, 'sla.escalated', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode,
    reason
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId,
    reason
  }, context);
  return { success: true };
}

async function getDepartmentWorkload(user) {
  const tasks = await getTaskInbox(user, {});
  return {
    total: tasks.length,
    unassigned: tasks.filter((item) => !item.assignedOfficerId).length,
    overdue: tasks.filter((item) => item.dueAt && new Date(item.dueAt) < new Date()).length,
    byStatus: tasks.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {})
  };
}

async function getOfficerWorkload(user) {
  const tasks = await getTaskInbox(user, {});
  return Object.values(tasks.reduce((acc, item) => {
    const key = String(item.assignedOfficerId || 'unassigned');
    if (!acc[key]) {
      acc[key] = {
        officerId: key,
        officerLabel: key === 'unassigned' ? 'Unassigned' : `Officer ${key.slice(-4)}`,
        activeTaskCount: 0,
        overdueTaskCount: 0
      };
    }
    acc[key].activeTaskCount += 1;
    if (item.dueAt && new Date(item.dueAt) < new Date()) acc[key].overdueTaskCount += 1;
    return acc;
  }, {}));
}

module.exports = {
  assignTask,
  reassignTask,
  escalateTask,
  getDepartmentWorkload,
  getOfficerWorkload
};
