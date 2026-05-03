const mongoose = require('mongoose');
const AnalyticsDailyRollup = require('../models/AnalyticsDailyRollup');
const DepartmentTurnaroundProjection = require('../models/DepartmentTurnaroundProjection');
const BottleneckProjection = require('../models/BottleneckProjection');
const DocumentDefectProjection = require('../models/DocumentDefectProjection');
const RejectionReasonProjection = require('../models/RejectionReasonProjection');
const QueryAgeingProjection = require('../models/QueryAgeingProjection');
const OfficerWorkloadProjection = require('../models/OfficerWorkloadProjection');
const EscalationFrequencyProjection = require('../models/EscalationFrequencyProjection');
const InvestorHistoryProjection = require('../models/InvestorHistoryProjection');
const cache = require('./analytics-cache.service');

const MIN_GROUP_SIZE = Number(process.env.ANALYTICS_MIN_GROUP_SIZE || 3);

function userScope(context = {}) {
  const user = context.user || {};
  return {
    role: user.primaryRole || user.role || context.role || 'anonymous',
    departmentCode: user.departmentCode || context.departmentCode || null,
    includePii: Boolean(context.includePii)
  };
}

function applyScopeFilter(filters = {}, context = {}) {
  const scope = userScope(context);
  if (scope.role === 'department_supervisor' || scope.role === 'department_officer') {
    return { ...filters, departmentCode: scope.departmentCode };
  }
  return filters;
}

function maskOfficerLabel(userId = '') {
  const v = String(userId || '');
  if (!v) return 'Officer';
  return `Officer-${v.slice(-4)}`;
}

function canSeeOfficerNames(context = {}) {
  const role = userScope(context).role;
  return role === 'admin' || role === 'department_supervisor';
}

function canSeePii(context = {}) {
  const role = userScope(context).role;
  return (role === 'admin' && String(process.env.ANALYTICS_ALLOW_PII_FOR_ADMIN || 'false') === 'true') || Boolean(context.includePiiAllowed);
}

function buildDateFilter(filters = {}) {
  const range = {};
  if (filters.fromDate) range.$gte = new Date(filters.fromDate);
  if (filters.toDate) range.$lte = new Date(filters.toDate);
  return Object.keys(range).length ? { $gte: range.$gte || new Date(0), $lte: range.$lte || new Date() } : null;
}

async function findWithFilter(Model, filters = {}, extra = {}) {
  if (mongoose.connection.readyState !== 1) return [];
  const q = { ...extra };
  if (filters.departmentCode) q.departmentCode = filters.departmentCode;
  if (filters.sector) q.sector = filters.sector;
  if (filters.district) q.district = filters.district;
  const dateRange = buildDateFilter(filters);
  if (dateRange) {
    if (q.date !== undefined) q.date = dateRange;
    else if (q.periodEnd !== undefined) q.periodEnd = dateRange;
  }
  return Model.find(q).sort({ updatedAt: -1 }).lean();
}

async function getManagementOverview(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:overview', scoped, scope, async () => {
    const rows = await findWithFilter(AnalyticsDailyRollup, scoped);
    const overview = rows.reduce(
      (acc, row) => {
        acc.totalApplications += Number(row.applicationsReceived || 0);
        acc.activeCases += Number(row.activeCases || 0);
        acc.approvals += Number(row.applicationsApproved || 0);
        acc.rejections += Number(row.applicationsRejected || 0);
        acc.slaBreaches += Number(row.slaBreaches || 0);
        acc.escalations += Number(row.escalationsRaised || 0);
        return acc;
      },
      { totalApplications: 0, activeCases: 0, approvals: 0, rejections: 0, slaBreaches: 0, escalations: 0 }
    );
    return overview;
  }, Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getBottleneckDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:bottlenecks', scoped, scope, () => findWithFilter(BottleneckProjection, scoped, { status: { $in: ['open', 'acknowledged'] } }), Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getDocumentDefectDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:document-defects', scoped, scope, async () => {
    const rows = await findWithFilter(DocumentDefectProjection, scoped);
    return rows.filter((r) => Number(r.occurrenceCount || 0) >= MIN_GROUP_SIZE);
  }, Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getDepartmentTurnaroundDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:department-turnaround', scoped, scope, () => findWithFilter(DepartmentTurnaroundProjection, scoped), Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getRejectionReasonDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:rejections', scoped, scope, async () => {
    const rows = await findWithFilter(RejectionReasonProjection, scoped);
    return rows.filter((r) => Number(r.rejectionCount || 0) >= MIN_GROUP_SIZE);
  }, Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getQueryAgeingDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:query-ageing', scoped, scope, () => findWithFilter(QueryAgeingProjection, scoped), Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getOfficerWorkloadDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:officer-workload', scoped, scope, async () => {
    const rows = await findWithFilter(OfficerWorkloadProjection, scoped);
    return rows.map((row) => ({
      ...row,
      officerDisplayName: canSeeOfficerNames(context) ? row.officerDisplayName || row.officerUserId : maskOfficerLabel(row.officerUserId)
    }));
  }, Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getEscalationFrequencyDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:escalations', scoped, scope, () => findWithFilter(EscalationFrequencyProjection, scoped), Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getInvestorHistoryDashboard(filters = {}, context = {}) {
  const scoped = applyScopeFilter(filters, context);
  const scope = userScope(context);
  return cache.getOrSet('analytics:investor-history', scoped, scope, async () => {
    const rows = await findWithFilter(InvestorHistoryProjection, scoped);
    const includePii = canSeePii(context);
    return rows.map((row) => ({
      ...row,
      organisationDisplayName: includePii ? row.organisationDisplayName : undefined,
      displayName: includePii ? row.organisationDisplayName : row.maskedOrganisationName
    }));
  }, Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300));
}

async function getReviewCommitteePack(filters = {}, context = {}) {
  const [overview, bottlenecks, turnaround, defects, rejections, escalations] = await Promise.all([
    getManagementOverview(filters, context),
    getBottleneckDashboard(filters, context),
    getDepartmentTurnaroundDashboard(filters, context),
    getDocumentDefectDashboard(filters, context),
    getRejectionReasonDashboard(filters, context),
    getEscalationFrequencyDashboard(filters, context)
  ]);
  return { overview: overview.data || overview, bottlenecks: bottlenecks.data || bottlenecks, departmentTurnaround: turnaround.data || turnaround, documentDefects: defects.data || defects, rejectionReasons: rejections.data || rejections, escalations: escalations.data || escalations };
}

module.exports = {
  getManagementOverview,
  getBottleneckDashboard,
  getDocumentDefectDashboard,
  getDepartmentTurnaroundDashboard,
  getRejectionReasonDashboard,
  getQueryAgeingDashboard,
  getOfficerWorkloadDashboard,
  getEscalationFrequencyDashboard,
  getInvestorHistoryDashboard,
  getReviewCommitteePack
};
