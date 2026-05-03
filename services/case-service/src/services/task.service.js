const approvalTaskRepository = require('../repositories/approval-task.repository');
const departmentRepository = require('../repositories/department.repository');
const { appendDomainEvent } = require('./event-outbox.service');
const { DOMAIN_EVENT_NAMES } = require('../../../../packages/shared/src');
const taskLifecycleService = require('../../../orchestration-service/src/services/task-lifecycle.service');

async function createDepartmentTasksForCase(caseDoc, context = {}) {
  const departments = await departmentRepository.findActiveByCodes(
    caseDoc.requiredDepartments.map((department) => department.departmentCode)
  );

  const tasks = [];
  for (const requiredDepartment of caseDoc.requiredDepartments) {
    const department = departments.find((item) => item.code === requiredDepartment.departmentCode);
    const task = await approvalTaskRepository.create(
      {
        caseId: caseDoc._id,
        universalCaseId: caseDoc.universalCaseId,
        departmentId: department?._id,
        departmentCode: requiredDepartment.departmentCode,
        taskType: requiredDepartment.requiredApprovalType || 'other',
        title: `${requiredDepartment.departmentCode} approval for ${caseDoc.title}`,
        status: 'pending',
        dueAt: caseDoc.slaSummary?.dueAt,
        warningAt: caseDoc.slaSummary?.warningAt,
        createdBy: context.userId,
        updatedBy: context.userId,
        correlationId: context.correlationId
      },
      context
    );
    tasks.push(task);

    await appendDomainEvent(
      {
        eventName: DOMAIN_EVENT_NAMES.TASK_CREATED,
        aggregateType: 'approval_task',
        aggregateId: task.id,
        universalCaseId: caseDoc.universalCaseId,
        payload: { taskId: task.id, departmentCode: task.departmentCode, caseId: caseDoc.id }
      },
      context
    );
  }

  return tasks;
}

async function assignTask(taskId, officerId, context = {}) {
  return taskLifecycleService.assignTask(taskId, officerId, {
    actor: context.user || {
      id: context.userId || null,
      primaryRole: context.primaryRole || 'system',
      permissions: context.permissions || []
    },
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  });
}

async function raiseQuery(taskId, message, context = {}) {
  return taskLifecycleService.raiseQuery(taskId, { message }, {
    actor: context.user || {
      id: context.userId || null,
      primaryRole: context.primaryRole || 'system',
      permissions: context.permissions || []
    },
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  });
}

async function submitTaskResponse(taskId, response, context = {}) {
  return taskLifecycleService.submitResponse(taskId, response, {
    actor: context.user || {
      id: context.userId || null,
      primaryRole: context.primaryRole || 'system',
      permissions: context.permissions || []
    },
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  });
}

async function approveTask(taskId, decision, context = {}) {
  return taskLifecycleService.approveTask(taskId, decision, {
    actor: context.user || {
      id: context.userId || null,
      primaryRole: context.primaryRole || 'system',
      permissions: context.permissions || []
    },
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  });
}

async function rejectTask(taskId, decision, context = {}) {
  return taskLifecycleService.rejectTask(taskId, decision, {
    actor: context.user || {
      id: context.userId || null,
      primaryRole: context.primaryRole || 'system',
      permissions: context.permissions || []
    },
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  });
}

module.exports = {
  createDepartmentTasksForCase,
  assignTask,
  raiseQuery,
  submitTaskResponse,
  approveTask,
  rejectTask
};
