const { TASK_STATUSES } = require('../../../../packages/shared/src');
const orchestrationService = require('./orchestration.service');

function assignTask(taskId, officerId, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.ASSIGNED, { officerId }, context);
}

function startReview(taskId, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.UNDER_REVIEW, {}, context);
}

function raiseQuery(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.QUERY_RAISED, payload, context);
}

function submitResponse(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.RESPONSE_RECEIVED, payload, context);
}

function requireInspection(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.INSPECTION_REQUIRED, payload, context);
}

function scheduleInspection(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.INSPECTION_SCHEDULED, payload, context);
}

function completeInspection(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.INSPECTION_COMPLETED, payload, context);
}

function demandFee(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.FEE_DEMANDED, payload, context);
}

function markFeePaid(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.FEE_PAID, payload, context);
}

function approveTask(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.APPROVED, payload, context);
}

function rejectTask(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.REJECTED, payload, context);
}

function issueCertificate(taskId, payload = {}, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.CERTIFICATE_ISSUED, payload, context);
}

function closeTask(taskId, context = {}) {
  return orchestrationService.transitionTask(taskId, TASK_STATUSES.CLOSED, {}, context);
}

module.exports = {
  assignTask,
  startReview,
  raiseQuery,
  submitResponse,
  requireInspection,
  scheduleInspection,
  completeInspection,
  demandFee,
  markFeePaid,
  approveTask,
  rejectTask,
  issueCertificate,
  closeTask
};
