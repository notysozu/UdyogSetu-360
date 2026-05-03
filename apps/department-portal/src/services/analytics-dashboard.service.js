const queryService = require('../../../../services/case-service/src/services/analytics-query.service');
const exportService = require('../../../../services/case-service/src/services/analytics-export.service');
const projectionService = require('../../../../services/case-service/src/services/analytics-projection.service');

function ctxFromUser(user = {}, context = {}) {
  const permissions = new Set(user.permissions || []);
  return {
    ...context,
    user,
    role: user.primaryRole || user.role,
    departmentCode: user.departmentCode || null,
    includePiiAllowed: permissions.has('analytics.view_pii')
  };
}

async function getOverview(user, filters, context = {}) {
  return queryService.getManagementOverview(filters, ctxFromUser(user, context));
}
async function getBottlenecks(user, filters, context = {}) {
  return queryService.getBottleneckDashboard(filters, ctxFromUser(user, context));
}
async function getDocumentDefects(user, filters, context = {}) {
  return queryService.getDocumentDefectDashboard(filters, ctxFromUser(user, context));
}
async function getDepartmentTurnaround(user, filters, context = {}) {
  return queryService.getDepartmentTurnaroundDashboard(filters, ctxFromUser(user, context));
}
async function getRejections(user, filters, context = {}) {
  return queryService.getRejectionReasonDashboard(filters, ctxFromUser(user, context));
}
async function getQueryAgeing(user, filters, context = {}) {
  return queryService.getQueryAgeingDashboard(filters, ctxFromUser(user, context));
}
async function getOfficerWorkload(user, filters, context = {}) {
  return queryService.getOfficerWorkloadDashboard(filters, ctxFromUser(user, context));
}
async function getEscalations(user, filters, context = {}) {
  return queryService.getEscalationFrequencyDashboard(filters, ctxFromUser(user, context));
}
async function getInvestorHistory(user, filters, context = {}) {
  return queryService.getInvestorHistoryDashboard(filters, ctxFromUser(user, context));
}
async function getReviewPack(user, filters, context = {}) {
  return queryService.getReviewCommitteePack(filters, ctxFromUser(user, context));
}

async function requestExport(user, input, context = {}) {
  const ctx = ctxFromUser(user, context);
  const created = await exportService.createExportJob(input, ctx);
  exportService.processExportJob(created.exportId, ctx).catch(() => {});
  return created;
}

async function listExports(user, filters = {}, context = {}) {
  return exportService.listExportJobs(user, filters, ctxFromUser(user, context));
}

async function getExport(user, exportId, context = {}) {
  return exportService.getExportJob(exportId, ctxFromUser(user, context));
}

async function rebuild(user, input, context = {}) {
  const ctx = ctxFromUser(user, context);
  if (input.dryRun) return { dryRun: true };
  if (input.projectionName) {
    return projectionService.rebuildProjection(input.projectionName, { fromDate: input.fromDate, toDate: input.toDate }, ctx);
  }
  return projectionService.rebuildAllProjections({ fromDate: input.fromDate, toDate: input.toDate }, ctx);
}

module.exports = {
  getOverview,
  getBottlenecks,
  getDocumentDefects,
  getDepartmentTurnaround,
  getRejections,
  getQueryAgeing,
  getOfficerWorkload,
  getEscalations,
  getInvestorHistory,
  getReviewPack,
  requestExport,
  listExports,
  getExport,
  rebuild
};
