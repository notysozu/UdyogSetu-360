const { sendSuccess } = require('../utils/api-response');

function dashboardPayload(type, req) {
  return {
    dashboard: type,
    todo: `Wire ${type} dashboard to projection queries.`,
    filters: req.query,
    correlationId: req.context.correlationId
  };
}

async function getInvestorDashboard(req, res) {
  return sendSuccess(res, dashboardPayload('investor', req));
}
async function getDepartmentDashboard(req, res) {
  return sendSuccess(res, dashboardPayload('department', req));
}
async function getNodalDashboard(req, res) {
  return sendSuccess(res, dashboardPayload('nodal', req));
}
async function getAdminDashboard(req, res) {
  return sendSuccess(res, dashboardPayload('admin', req));
}
async function getAuditDashboard(req, res) {
  return sendSuccess(res, dashboardPayload('audit', req));
}
async function getPublicMetrics(req, res) {
  return sendSuccess(res, dashboardPayload('public-metrics', req));
}

module.exports = {
  getInvestorDashboard,
  getDepartmentDashboard,
  getNodalDashboard,
  getAdminDashboard,
  getAuditDashboard,
  getPublicMetrics
};
