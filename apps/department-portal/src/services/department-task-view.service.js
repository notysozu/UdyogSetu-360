const mongoose = require('mongoose');
const ApprovalTask = require('../../../../services/case-service/src/models/ApprovalTask');
const Case = require('../../../../services/case-service/src/models/Case');
const Document = require('../../../../services/case-service/src/models/Document');
const SlaTimer = require('../../../../services/case-service/src/models/SlaTimer');
const EventLog = require('../../../../web/src/models/EventLog');
const { departmentTasks, documents, comments, slaTimers, mockCase } = require('../mock/department.mock');
const commentService = require('./department-comment.service');

function useMockData() {
  return String(process.env.USE_MOCK_DEPARTMENT_DATA || 'true') === 'true' || mongoose.connection.readyState !== 1;
}

function assertTaskAccess(user, task) {
  const role = user.primaryRole || user.role;
  if (role === 'admin' || role === 'auditor') return true;
  if (role === 'nodal_officer') return true;
  if (task.departmentCode !== user.departmentCode) {
    const error = new Error('Access denied to task outside your department.');
    error.status = 403;
    throw error;
  }
  return true;
}

async function getTaskInbox(user, filters = {}) {
  if (useMockData()) {
    return departmentTasks.filter((task) => !user.departmentCode || task.departmentCode === user.departmentCode || ['nodal_officer', 'auditor', 'admin', 'department_supervisor'].includes(user.primaryRole || user.role));
  }
  const query = {};
  const role = user.primaryRole || user.role;
  if (!['admin', 'auditor', 'nodal_officer'].includes(role)) {
    query.departmentCode = user.departmentCode;
  }
  if (role === 'department_officer') {
    query.$or = [{ assignedOfficerId: user.id }, { assignedOfficerId: null }];
  }
  if (filters.status) query.status = filters.status;
  return ApprovalTask.find(query).sort({ dueAt: 1, updatedAt: -1 }).limit(100);
}

async function getTaskDetail(user, taskId) {
  if (useMockData()) {
    const task = departmentTasks.find((item) => String(item._id) === String(taskId));
    if (!task) return null;
    assertTaskAccess(user, task);
    return task;
  }
  const task = await ApprovalTask.findById(taskId);
  if (!task) return null;
  assertTaskAccess(user, task);
  return task;
}

async function getTaskDocuments(user, taskId) {
  const task = await getTaskDetail(user, taskId);
  if (!task) return [];
  if (useMockData()) {
    return documents.filter((item) => String(item.taskId) === String(taskId));
  }
  return Document.find({ taskId: task._id, isDeleted: false }).sort({ createdAt: -1 });
}

async function getTaskTimeline(user, taskId) {
  const task = await getTaskDetail(user, taskId);
  if (!task) return [];
  if (useMockData()) {
    return [{
      occurredAt: task.createdAt,
      type: 'task.created',
      payload: { title: task.title, description: 'Task created for department scrutiny.', departmentCode: task.departmentCode }
    }];
  }
  return EventLog.find({ $or: [{ 'payload.taskId': String(task._id) }, { caseId: task.caseId }] }).sort({ occurredAt: -1 }).limit(40);
}

async function getTaskComments(user, taskId) {
  const task = await getTaskDetail(user, taskId);
  if (!task) return [];
  if (useMockData()) {
    return comments.filter((item) => String(item.taskId) === String(taskId));
  }
  return commentService.listComments('task', task._id, {
    role: user.primaryRole || user.role
  });
}

async function getTaskSlaStatus(user, taskId) {
  const task = await getTaskDetail(user, taskId);
  if (!task) return null;
  if (useMockData()) {
    return slaTimers.find((item) => String(item.taskId) === String(taskId)) || null;
  }
  return SlaTimer.findOne({ taskId: task._id, isDeleted: false }).sort({ createdAt: -1 });
}

async function getCaseCoordinationView(user, caseId) {
  if (useMockData()) {
    return {
      caseDoc: mockCase,
      tasks: departmentTasks,
      comments
    };
  }
  const caseDoc = await Case.findOne({ $or: [{ caseId }, { universalCaseId: caseId }, { _id: caseId }] });
  if (!caseDoc) return null;
  const tasks = await ApprovalTask.find({ caseId: caseDoc._id }).sort({ createdAt: 1 });
  const caseComments = await commentService.listComments('case', caseDoc._id, { role: user.primaryRole || user.role });
  return { caseDoc, tasks, comments: caseComments };
}

module.exports = {
  useMockData,
  assertTaskAccess,
  getTaskInbox,
  getTaskDetail,
  getTaskDocuments,
  getTaskTimeline,
  getTaskComments,
  getTaskSlaStatus,
  getCaseCoordinationView
};
