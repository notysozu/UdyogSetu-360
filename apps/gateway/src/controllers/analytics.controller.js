const queryService = require('../../../../services/case-service/src/services/analytics-query.service');
const { sendSuccess } = require('../utils/api-response');

function contextFromReq(req, includePii = false) {
  const actor = req.user || {};
  const permissions = new Set(actor.permissions || []);
  return {
    user: actor,
    role: actor.primaryRole || null,
    departmentCode: actor.departmentCode || null,
    includePii: Boolean(includePii),
    includePiiAllowed: permissions.has('analytics.view_pii'),
    correlationId: req.context?.correlationId || req.correlationId,
    requestId: req.context?.requestId || req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function getOverviewApi(req, res) {
  const result = await queryService.getManagementOverview(req.query || {}, contextFromReq(req, req.query.includePii));
  return sendSuccess(res, result.data, {
    cache: { hit: result.hit, ttlSeconds: result.ttlSeconds },
    privacy: { piiIncluded: Boolean(req.query.includePii), minGroupSize: Number(process.env.ANALYTICS_MIN_GROUP_SIZE || 3) }
  });
}

async function getBottlenecksApi(req, res) {
  const result = await queryService.getBottleneckDashboard(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getDocumentDefectsApi(req, res) {
  const result = await queryService.getDocumentDefectDashboard(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getDepartmentTurnaroundApi(req, res) {
  const result = await queryService.getDepartmentTurnaroundDashboard(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getRejectionReasonsApi(req, res) {
  const result = await queryService.getRejectionReasonDashboard(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getQueryAgeingApi(req, res) {
  const result = await queryService.getQueryAgeingDashboard(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getOfficerWorkloadApi(req, res) {
  const result = await queryService.getOfficerWorkloadDashboard(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getEscalationsApi(req, res) {
  const result = await queryService.getEscalationFrequencyDashboard(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getInvestorHistoryApi(req, res) {
  const result = await queryService.getInvestorHistoryDashboard(req.query || {}, contextFromReq(req, req.query.includePii));
  return sendSuccess(res, result.data, { cache: { hit: result.hit, ttlSeconds: result.ttlSeconds } });
}
async function getReviewPackApi(req, res) {
  const result = await queryService.getReviewCommitteePack(req.query || {}, contextFromReq(req));
  return sendSuccess(res, result, { privacy: { piiIncluded: false } });
}

module.exports = {
  getOverviewApi,
  getBottlenecksApi,
  getDocumentDefectsApi,
  getDepartmentTurnaroundApi,
  getRejectionReasonsApi,
  getQueryAgeingApi,
  getOfficerWorkloadApi,
  getEscalationsApi,
  getInvestorHistoryApi,
  getReviewPackApi
};
