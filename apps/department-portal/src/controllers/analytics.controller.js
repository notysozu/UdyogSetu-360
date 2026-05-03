const analyticsService = require('../services/analytics-dashboard.service');

function ctx(req) {
  return {
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

function filtersFromQuery(query = {}) {
  return {
    fromDate: query.fromDate,
    toDate: query.toDate,
    departmentCode: query.departmentCode,
    district: query.district,
    sector: query.sector,
    includePii: query.includePii === 'true'
  };
}

function renderAnalytics(req, res, view, title, data = {}) {
  return res.render(`analytics/${view}`, {
    title,
    filters: filtersFromQuery(req.query || {}),
    analytics: data,
    pageName: view
  });
}

async function showOverview(req, res) {
  const result = await analyticsService.getOverview(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'overview', 'Analytics Overview', result.data || result);
}
async function showBottlenecks(req, res) {
  const result = await analyticsService.getBottlenecks(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'bottlenecks', 'Bottlenecks', result.data || result);
}
async function showDocumentDefects(req, res) {
  const result = await analyticsService.getDocumentDefects(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'document-defects', 'Document Defects', result.data || result);
}
async function showDepartmentTurnaround(req, res) {
  const result = await analyticsService.getDepartmentTurnaround(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'department-turnaround', 'Department Turnaround', result.data || result);
}
async function showRejectionReasons(req, res) {
  const result = await analyticsService.getRejections(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'rejection-reasons', 'Rejection Reasons', result.data || result);
}
async function showQueryAgeing(req, res) {
  const result = await analyticsService.getQueryAgeing(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'query-ageing', 'Query Ageing', result.data || result);
}
async function showOfficerWorkload(req, res) {
  const result = await analyticsService.getOfficerWorkload(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'officer-workload', 'Officer Workload', result.data || result);
}
async function showEscalations(req, res) {
  const result = await analyticsService.getEscalations(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'escalation-frequency', 'Escalation Frequency', result.data || result);
}
async function showInvestorHistory(req, res) {
  const result = await analyticsService.getInvestorHistory(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'investor-history', 'Investor History', result.data || result);
}
async function showReviewPack(req, res) {
  const result = await analyticsService.getReviewPack(req.user, filtersFromQuery(req.query), ctx(req));
  return renderAnalytics(req, res, 'review-pack', 'Review Committee Pack', result);
}

async function showExportList(req, res) {
  const rows = await analyticsService.listExports(req.user, req.query || {}, ctx(req));
  return res.render('analytics/export-list', { title: 'Analytics Exports', rows, filters: req.query || {}, pageName: 'export-list' });
}

async function requestExport(req, res) {
  const created = await analyticsService.requestExport(
    req.user,
    {
      exportType: req.body.exportType || 'overview',
      format: req.body.format || 'csv',
      filters: filtersFromQuery(req.body || req.query || {}),
      includePii: req.body.includePii === 'true'
    },
    ctx(req)
  );
  req.flash('success', `Export ${created.exportId} queued.`);
  return res.redirect('/admin/analytics/exports');
}

module.exports = {
  showOverview,
  showBottlenecks,
  showDocumentDefects,
  showDepartmentTurnaround,
  showRejectionReasons,
  showQueryAgeing,
  showOfficerWorkload,
  showEscalations,
  showInvestorHistory,
  showReviewPack,
  showExportList,
  requestExport
};
