const { createGatewayProxyService } = require('../services/gateway-proxy.service');
const { sendAccepted, sendCreated, sendSuccess, paginatedResponse } = require('../utils/api-response');

function stub(resource, action, req, extra = {}) {
  return {
    resource,
    action,
    todo: `Wire ${resource}.${action} to an internal service or adapter.`,
    path: req.originalUrl,
    correlationId: req.context.correlationId,
    ...extra
  };
}

async function createCase(req, res) {
  const proxy = createGatewayProxyService();
  const payload = await proxy.callCaseService('/cases', { method: 'POST', body: req.body }, null);
  if (payload) return sendCreated(res, payload);
  return sendCreated(res, stub('case', 'createCase', req, { input: req.body }));
}

async function listCases(req, res) {
  const proxy = createGatewayProxyService();
  const payload = await proxy.callCaseService('/cases', {}, null);
  const items = payload?.data || [];
  return sendSuccess(res, paginatedResponse(items, {
    page: req.query.page,
    limit: req.query.limit,
    total: Array.isArray(items) ? items.length : 0
  }));
}

async function getCaseById(req, res) {
  return sendSuccess(res, stub('case', 'getCaseById', req, { caseId: req.params.caseId }));
}

async function updateCase(req, res) {
  return sendSuccess(res, stub('case', 'updateCase', req, { caseId: req.params.caseId, patch: req.body }));
}

async function submitCase(req, res) {
  return sendAccepted(res, stub('case', 'submitCase', req, { caseId: req.params.caseId }));
}

async function amendCase(req, res) {
  return sendAccepted(res, stub('case', 'amendCase', req, { caseId: req.params.caseId, amendment: req.body }));
}

async function getCaseTimeline(req, res) {
  return sendSuccess(res, stub('case', 'getCaseTimeline', req, { caseId: req.params.caseId }));
}

async function getCaseTasks(req, res) {
  return sendSuccess(res, stub('case', 'getCaseTasks', req, { caseId: req.params.caseId }));
}

async function getCaseDocuments(req, res) {
  return sendSuccess(res, stub('case', 'getCaseDocuments', req, { caseId: req.params.caseId }));
}

async function getCaseGrievances(req, res) {
  return sendSuccess(res, stub('case', 'getCaseGrievances', req, { caseId: req.params.caseId }));
}

module.exports = {
  createCase,
  listCases,
  getCaseById,
  updateCase,
  submitCase,
  amendCase,
  getCaseTimeline,
  getCaseTasks,
  getCaseDocuments,
  getCaseGrievances
};
