const {
  AppError,
  PERMISSIONS,
  CASE_STATUSES,
  TASK_STATUSES,
  USER_ROLES
} = require('../../../../packages/shared/src');
const { getCaseTransition } = require('../state-machines/case-state-machine');
const { getTaskTransition } = require('../state-machines/task-state-machine');
const { assertDependenciesSatisfied } = require('./dependency-guards');

function hasRequiredPermission(actor, permission) {
  if (!permission) {
    return true;
  }
  if (!actor) {
    return false;
  }
  if ((actor.roles || []).includes(USER_ROLES.ADMIN) || actor.primaryRole === USER_ROLES.ADMIN) {
    return true;
  }
  if ((actor.roles || []).includes(USER_ROLES.SYSTEM) || actor.primaryRole === USER_ROLES.SYSTEM) {
    return true;
  }
  return (actor.permissions || []).includes(permission);
}

function canActorPerformTransition(actor, transition, context = {}) {
  if (!transition) {
    return false;
  }
  if (context.override) {
    return hasRequiredPermission(actor, PERMISSIONS.CASE_UPDATE);
  }
  if (transition.systemTriggered) {
    return hasRequiredPermission(actor, transition.permission) || actor?.primaryRole === USER_ROLES.SYSTEM;
  }
  return hasRequiredPermission(actor, transition.permission);
}

function isCaseMutable(caseDoc) {
  return caseDoc && caseDoc.status !== CASE_STATUSES.CLOSED;
}

function isTaskMutable(taskDoc) {
  return taskDoc && ![TASK_STATUSES.CLOSED, TASK_STATUSES.CANCELLED].includes(taskDoc.status);
}

function isMandatoryTask(taskDoc) {
  return taskDoc?.metadata?.isMandatory !== false;
}

function hasOpenQuery(taskDoc) {
  return taskDoc?.status === TASK_STATUSES.QUERY_RAISED || (taskDoc?.queryThread || []).some((item) => item.status === 'open');
}

function hasUnpaidFee(taskDoc) {
  return taskDoc?.status === TASK_STATUSES.FEE_DEMANDED;
}

function hasPendingInspection(taskDoc) {
  return [TASK_STATUSES.INSPECTION_REQUIRED, TASK_STATUSES.INSPECTION_SCHEDULED].includes(taskDoc?.status);
}

function hasRequiredDocuments(caseDoc, taskDoc) {
  const required = taskDoc?.metadata?.requiredDocuments || [];
  if (!required.length) {
    return true;
  }
  const available = caseDoc?.metadata?.documents || [];
  return required.every((documentType) =>
    available.some((document) => document.documentType === documentType)
  );
}

function allMandatoryTasksApproved(_caseDoc, tasks = []) {
  const mandatoryTasks = tasks.filter(isMandatoryTask);
  return Boolean(
    mandatoryTasks.length &&
      mandatoryTasks.every((task) =>
        [TASK_STATUSES.APPROVED, TASK_STATUSES.CERTIFICATE_ISSUED, TASK_STATUSES.CLOSED].includes(
          task.status
        )
      )
  );
}

function anyMandatoryTaskRejected(_caseDoc, tasks = []) {
  return tasks.some((task) => isMandatoryTask(task) && task.status === TASK_STATUSES.REJECTED);
}

function allRequiredFeesPaid(_caseDoc, tasks = []) {
  const feeTasks = tasks.filter((task) =>
    [TASK_STATUSES.FEE_DEMANDED, TASK_STATUSES.FEE_PAID, TASK_STATUSES.APPROVED, TASK_STATUSES.CERTIFICATE_ISSUED, TASK_STATUSES.CLOSED].includes(task.status)
  );
  return feeTasks.length > 0 && feeTasks.every((task) => task.status !== TASK_STATUSES.FEE_DEMANDED);
}

function allRequiredInspectionsCompleted(_caseDoc, tasks = []) {
  const inspectionTasks = tasks.filter((task) =>
    [TASK_STATUSES.INSPECTION_REQUIRED, TASK_STATUSES.INSPECTION_SCHEDULED, TASK_STATUSES.INSPECTION_COMPLETED, TASK_STATUSES.APPROVED, TASK_STATUSES.REJECTED, TASK_STATUSES.CLOSED].includes(task.status)
  );
  return inspectionTasks.length > 0 &&
    inspectionTasks.every((task) =>
      ![TASK_STATUSES.INSPECTION_REQUIRED, TASK_STATUSES.INSPECTION_SCHEDULED].includes(task.status)
    );
}

function allRequiredCertificatesIssued(_caseDoc, tasks = []) {
  const approvedTasks = tasks.filter((task) =>
    [TASK_STATUSES.APPROVED, TASK_STATUSES.CERTIFICATE_ISSUED, TASK_STATUSES.CLOSED].includes(task.status)
  );
  return approvedTasks.length > 0 &&
    approvedTasks.every((task) =>
      [TASK_STATUSES.CERTIFICATE_ISSUED, TASK_STATUSES.CLOSED].includes(task.status)
    );
}

function ensureReasonIfRequired(transition, context = {}) {
  if (transition?.reasonRequired && !context.reason && !context.payload?.reason && !context.overrideReason) {
    throw new AppError('A reason is required for this transition.', 400);
  }
}

function ensureTaskPrerequisites(taskDoc, nextStatus, context = {}) {
  if (nextStatus === TASK_STATUSES.APPROVED) {
    const incompleteChecklistItem = (taskDoc.checklist || []).find(
      (item) => item.required && item.status !== 'completed'
    );
    if (incompleteChecklistItem) {
      throw new AppError('Task approval requires required checklist completion.', 409, {
        checklistCode: incompleteChecklistItem.code
      });
    }
  }
  if (nextStatus === TASK_STATUSES.FEE_PAID && !context.payload?.paymentReference) {
    throw new AppError('Fee paid transition requires payment reference.', 400);
  }
  if (
    nextStatus === TASK_STATUSES.CERTIFICATE_ISSUED &&
    !context.payload?.certificateNumber &&
    !context.payload?.documentId
  ) {
    throw new AppError('Certificate issuance requires certificate number or document reference.', 400);
  }
}

function canTransitionCase(caseDoc, nextStatus, context = {}) {
  const transition = getCaseTransition(caseDoc?.status, nextStatus);
  if (!transition) {
    return false;
  }
  if (!isCaseMutable(caseDoc) && nextStatus !== CASE_STATUSES.REOPENED) {
    return false;
  }
  if (!canActorPerformTransition(context.actor, transition, context)) {
    return false;
  }
  return true;
}

function canTransitionTask(taskDoc, nextStatus, context = {}) {
  const transition = getTaskTransition(taskDoc?.status, nextStatus);
  if (!transition) {
    return false;
  }
  if (!isTaskMutable(taskDoc) && nextStatus !== TASK_STATUSES.CLOSED) {
    return false;
  }
  if (!canActorPerformTransition(context.actor, transition, context)) {
    return false;
  }
  return true;
}

function assertCaseTransitionAllowed(caseDoc, nextStatus, context = {}) {
  const transition = getCaseTransition(caseDoc?.status, nextStatus);
  if (!transition) {
    throw new AppError(`Invalid case transition from ${caseDoc?.status} to ${nextStatus}.`, 409);
  }
  if (!isCaseMutable(caseDoc) && nextStatus !== CASE_STATUSES.REOPENED) {
    throw new AppError('Closed cases cannot change unless reopened.', 409);
  }
  ensureReasonIfRequired(transition, context);
  if (!canActorPerformTransition(context.actor, transition, context)) {
    throw new AppError('Actor is not allowed to perform this case transition.', 403);
  }
  return transition;
}

function assertTaskTransitionAllowed(caseDoc, taskDoc, nextStatus, context = {}) {
  const transition = getTaskTransition(taskDoc?.status, nextStatus);
  if (!transition) {
    throw new AppError(`Invalid task transition from ${taskDoc?.status} to ${nextStatus}.`, 409);
  }
  if (!isTaskMutable(taskDoc) && nextStatus !== TASK_STATUSES.CLOSED) {
    throw new AppError('Task is no longer mutable.', 409);
  }
  ensureReasonIfRequired(transition, context);
  if (!canActorPerformTransition(context.actor, transition, context)) {
    throw new AppError('Actor is not allowed to perform this task transition.', 403);
  }
  if (!hasRequiredDocuments(caseDoc, taskDoc)) {
    throw new AppError('Required documents are missing for this task transition.', 409);
  }
  ensureTaskPrerequisites(taskDoc, nextStatus, context);
  assertDependenciesSatisfied(caseDoc, taskDoc, nextStatus);
  return transition;
}

module.exports = {
  canTransitionCase,
  canTransitionTask,
  assertCaseTransitionAllowed,
  assertTaskTransitionAllowed,
  canActorPerformTransition,
  hasRequiredPermission,
  isCaseMutable,
  isTaskMutable,
  isMandatoryTask,
  hasOpenQuery,
  hasUnpaidFee,
  hasPendingInspection,
  hasRequiredDocuments,
  allMandatoryTasksApproved,
  anyMandatoryTaskRejected,
  allRequiredFeesPaid,
  allRequiredInspectionsCompleted,
  allRequiredCertificatesIssued
};
