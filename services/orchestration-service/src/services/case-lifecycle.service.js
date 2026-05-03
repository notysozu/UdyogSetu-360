const { CASE_STATUSES } = require('../../../../packages/shared/src');
const orchestrationService = require('./orchestration.service');

function submitCase(caseId, payload = {}, context = {}) {
  return orchestrationService.transitionCase(caseId, CASE_STATUSES.SUBMITTED, payload, context);
}

function startScrutiny(caseId, context = {}) {
  return orchestrationService.transitionCase(caseId, CASE_STATUSES.UNDER_SCRUTINY, {}, context);
}

function requestAmendment(caseId, payload = {}, context = {}) {
  return orchestrationService.transitionCase(caseId, CASE_STATUSES.AMENDMENT_REQUESTED, payload, context);
}

function applyAmendment(caseId, payload = {}, context = {}) {
  return orchestrationService.transitionCase(caseId, CASE_STATUSES.AMENDED, payload, context);
}

function reopenCase(caseId, payload = {}, context = {}) {
  return orchestrationService.transitionCase(caseId, CASE_STATUSES.REOPENED, payload, context);
}

function closeCase(caseId, payload = {}, context = {}) {
  return orchestrationService.transitionCase(caseId, CASE_STATUSES.CLOSED, payload, context);
}

function withdrawCase(caseId, payload = {}, context = {}) {
  return orchestrationService.transitionCase(caseId, CASE_STATUSES.WITHDRAWN, payload, context);
}

module.exports = {
  submitCase,
  startScrutiny,
  requestAmendment,
  applyAmendment,
  reopenCase,
  closeCase,
  withdrawCase
};
