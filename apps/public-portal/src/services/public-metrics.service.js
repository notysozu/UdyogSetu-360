const mongoose = require('mongoose');
const repository = require('../repositories/public-metrics.repository');
const cache = require('./public-metrics-cache.service');
const mock = require('../mock/public.mock');

const MIN_GROUP_SIZE = Number(process.env.PUBLIC_METRICS_MIN_GROUP_SIZE || 5);
const mockEnabled =
  String(process.env.ANALYTICS_USE_MOCK_DATA || 'false') === 'true' ||
  process.env.NODE_ENV !== 'production';

function mergeSmallGroups(rows, countKey) {
  const stable = [];
  let merged = 0;
  for (const row of rows || []) {
    const count = Number(row[countKey] || row.count || 0);
    if (count < MIN_GROUP_SIZE) merged += count;
    else stable.push(row);
  }
  if (merged) stable.push({ label: 'Other', [countKey]: merged, count: merged, insufficientPublicData: true });
  return stable;
}

function buildOverviewFromDocs(docs = []) {
  if (!docs.length) {
    return mockEnabled
      ? mock.overview
      : {
          totalApplicationsReceived: 0,
          applicationsSubmittedThisMonth: 0,
          activeApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          certificatesIssued: 0,
          grievancesOpened: 0,
          grievancesResolved: 0,
          averageTurnaroundDays: 0
        };
  }
  const totalApplicationsReceived = docs.reduce((sum, doc) => sum + Number(doc.totalApplicationsReceived || doc.applicationsReceived || 0), 0);
  const approvedApplications = docs.reduce((sum, doc) => sum + Number(doc.approvedApplications || doc.approvalsIssued || 0), 0);
  const rejectedApplications = docs.reduce((sum, doc) => sum + Number(doc.rejectedApplications || doc.rejectionsIssued || 0), 0);
  const activeApplications = docs.reduce((sum, doc) => sum + Number(doc.activeApplications || 0), 0);
  const certificatesIssued = docs.reduce((sum, doc) => sum + Number(doc.certificatesIssued || 0), 0);
  const grievancesOpened = docs.reduce((sum, doc) => sum + Number(doc.grievancesOpened || 0), 0);
  const grievancesResolved = docs.reduce((sum, doc) => sum + Number(doc.grievancesResolved || 0), 0);
  const averageTurnaroundDays = docs.length
    ? Number((docs.reduce((sum, doc) => sum + Number(doc.averageTurnaroundDays || 0), 0) / docs.length).toFixed(1))
    : 0;
  const now = new Date();
  const applicationsSubmittedThisMonth = docs
    .filter((doc) => {
      const date = new Date(doc.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, doc) => sum + Number(doc.applicationsSubmitted || doc.applicationsReceived || 0), 0);
  return {
    totalApplicationsReceived,
    applicationsSubmittedThisMonth,
    activeApplications,
    approvedApplications,
    rejectedApplications,
    certificatesIssued,
    grievancesOpened,
    grievancesResolved,
    averageTurnaroundDays
  };
}

function buildStageCounts(raw = []) {
  if (!raw.length) return mockEnabled ? mock.stageCounts : [];
  if (raw[0].stage) return mergeSmallGroups(raw, 'count');
  const stageMap = new Map();
  raw.forEach((doc) => {
    Object.entries(doc.stageCounts || {}).forEach(([stage, count]) => {
      stageMap.set(stage, (stageMap.get(stage) || 0) + Number(count || 0));
    });
  });
  return mergeSmallGroups(Array.from(stageMap.entries()).map(([stage, count]) => ({ stage, count })), 'count');
}

function buildDepartmentTurnaround(raw = []) {
  if (!raw.length) return mockEnabled ? mock.departmentTurnaround : [];
  if (raw[0].departmentCode && raw[0].applicationsHandled !== undefined) {
    return mergeSmallGroups(raw, 'applicationsHandled');
  }
  return mergeSmallGroups(raw.map((row) => ({
    departmentCode: row.departmentCode,
    applicationsHandled: Number((row.pendingCount || 0) + (row.approvedCount || 0) + (row.rejectedCount || 0)),
    approvedCount: Number(row.approvedCount || 0),
    rejectedCount: Number(row.rejectedCount || 0),
    averageTurnaroundDays: Number((((row.averageTurnaroundHours || row.avgTurnaroundHours || 0) / 24)).toFixed(1)),
    medianTurnaroundDays: Number((((row.medianTurnaroundHours || row.averageTurnaroundHours || row.avgTurnaroundHours || 0) / 24)).toFixed(1)),
    slaBreachPercentage: Number((((row.overdueCount || 0) / Math.max((row.pendingCount || 0) + (row.approvedCount || 0) + (row.rejectedCount || 0), 1)) * 100).toFixed(1)),
    activePendingCount: Number(row.pendingCount || 0)
  })), 'applicationsHandled');
}

function buildApprovalRates(raw = {}, overview = null) {
  if (!raw.stages && !raw.departments && !raw.monthly) {
    return mockEnabled
      ? mock.approvalRates
      : { overallApprovalRate: 0, rejectionRate: 0, departmentWise: [], monthlyTrend: [] };
  }
  const departmentWise = buildDepartmentTurnaround(raw.departments || []).map((row) => ({
    departmentCode: row.departmentCode,
    approvalRate: Number(((row.approvedCount / Math.max(row.approvedCount + row.rejectedCount, 1)) * 100).toFixed(1))
  }));
  const approved = overview?.approvedApplications || 0;
  const rejected = overview?.rejectedApplications || 0;
  const totalDecisions = Math.max(approved + rejected, 1);
  const monthlyTrend = (raw.monthly || []).slice(-12).map((doc) => ({
    month: doc.date,
    approvalRate: Number(doc.approvalRates?.overallApprovalRate || ((Number(doc.approvedApplications || doc.approvalsIssued || 0) / Math.max(Number(doc.approvedApplications || doc.approvalsIssued || 0) + Number(doc.rejectedApplications || doc.rejectionsIssued || 0), 1)) * 100).toFixed(1)),
    rejectionRate: Number(doc.approvalRates?.rejectionRate || ((Number(doc.rejectedApplications || doc.rejectionsIssued || 0) / Math.max(Number(doc.approvedApplications || doc.approvalsIssued || 0) + Number(doc.rejectedApplications || doc.rejectionsIssued || 0), 1)) * 100).toFixed(1))
  }));
  return {
    overallApprovalRate: Number(((approved / totalDecisions) * 100).toFixed(1)),
    rejectionRate: Number(((rejected / totalDecisions) * 100).toFixed(1)),
    departmentWise,
    monthlyTrend: monthlyTrend.length ? monthlyTrend : (mockEnabled ? mock.approvalRates.monthlyTrend : [])
  };
}

function buildCertificateMetrics(raw = []) {
  if (!raw.length) {
    return mockEnabled
      ? mock.certificateMetrics
      : {
          totalIssued: 0,
          byDepartment: [],
          byMonth: [],
          activeCount: 0,
          expiredCount: 0,
          revokedCount: 0,
          publicVerificationCount: 0
        };
  }
  if (raw[0].certificateBreakdown || raw[0].date) {
    const docs = raw;
    const totalIssued = docs.reduce((sum, doc) => sum + Number(doc.certificatesIssued || 0), 0);
    const byDepartmentMap = new Map();
    docs.forEach((doc) => {
      Object.entries(doc.certificateBreakdown?.byDepartment || {}).forEach(([departmentCode, count]) => {
        byDepartmentMap.set(departmentCode, (byDepartmentMap.get(departmentCode) || 0) + Number(count || 0));
      });
    });
    return {
      totalIssued,
      byDepartment: Array.from(byDepartmentMap.entries()).map(([departmentCode, certificatesIssued]) => ({ departmentCode, certificatesIssued })),
      byMonth: docs.slice(-12).map((doc) => ({ month: doc.date, certificatesIssued: Number(doc.certificatesIssued || 0) })),
      activeCount: docs.reduce((sum, doc) => sum + Number(doc.certificateBreakdown?.activeCount || 0), 0),
      expiredCount: docs.reduce((sum, doc) => sum + Number(doc.certificateBreakdown?.expiredCount || 0), 0),
      revokedCount: docs.reduce((sum, doc) => sum + Number(doc.certificateBreakdown?.revokedCount || 0), 0),
      publicVerificationCount: docs.reduce((sum, doc) => sum + Number(doc.certificateBreakdown?.publicVerificationCount || 0), 0)
    };
  }
  return {
    totalIssued: raw.reduce((sum, row) => sum + Number(row.certificatesIssued || 0), 0),
    byDepartment: raw.map((row) => ({ departmentCode: row._id, certificatesIssued: Number(row.certificatesIssued || 0) })),
    byMonth: mockEnabled ? mock.certificateMetrics.byMonth : [],
    activeCount: raw.reduce((sum, row) => sum + Number(row.activeCount || 0), 0),
    expiredCount: raw.reduce((sum, row) => sum + Number(row.expiredCount || 0), 0),
    revokedCount: raw.reduce((sum, row) => sum + Number(row.revokedCount || 0), 0),
    publicVerificationCount: 0
  };
}

function buildGrievanceMetrics(raw = []) {
  if (!raw.length) {
    return mockEnabled
      ? mock.grievanceMetrics
      : {
          grievancesOpened: 0,
          grievancesResolved: 0,
          averageResolutionHours: 0,
          openGrievances: 0,
          closureRate: 0,
          byDepartment: [],
          monthlyTrend: []
        };
  }
  if (raw[0].grievanceBreakdown || raw[0].date) {
    const docs = raw;
    const monthlyTrend = docs.slice(-12).map((doc) => ({
      month: doc.date,
      opened: Number(doc.grievancesOpened || 0),
      resolved: Number(doc.grievancesResolved || 0)
    }));
    const byDepartmentMap = new Map();
    docs.forEach((doc) => {
      Object.entries(doc.grievanceBreakdown?.byDepartment || {}).forEach(([departmentCode, grievanceCount]) => {
        byDepartmentMap.set(departmentCode, (byDepartmentMap.get(departmentCode) || 0) + Number(grievanceCount || 0));
      });
    });
    const grievancesOpened = docs.reduce((sum, doc) => sum + Number(doc.grievancesOpened || 0), 0);
    const grievancesResolved = docs.reduce((sum, doc) => sum + Number(doc.grievancesResolved || 0), 0);
    return {
      grievancesOpened,
      grievancesResolved,
      averageResolutionHours: Number((docs.reduce((sum, doc) => sum + Number(doc.grievanceBreakdown?.averageResolutionHours || 0), 0) / Math.max(docs.length, 1)).toFixed(1)),
      openGrievances: Math.max(grievancesOpened - grievancesResolved, 0),
      closureRate: Number(((grievancesResolved / Math.max(grievancesOpened, 1)) * 100).toFixed(1)),
      byDepartment: Array.from(byDepartmentMap.entries()).map(([departmentCode, grievanceCount]) => ({ departmentCode, grievanceCount })),
      monthlyTrend
    };
  }
  const grievancesOpened = raw.reduce((sum, row) => sum + Number(row.grievancesOpened || 0), 0);
  const grievancesResolved = raw.reduce((sum, row) => sum + Number(row.grievancesResolved || 0), 0);
  return {
    grievancesOpened,
    grievancesResolved,
    averageResolutionHours: 0,
    openGrievances: raw.reduce((sum, row) => sum + Number(row.openGrievances || 0), 0),
    closureRate: Number(((grievancesResolved / Math.max(grievancesOpened, 1)) * 100).toFixed(1)),
    byDepartment: raw.map((row) => ({ departmentCode: row._id, grievanceCount: Number(row.grievancesOpened || 0) })),
    monthlyTrend: mockEnabled ? mock.grievanceMetrics.monthlyTrend : []
  };
}

async function getPublicMetricsBundle(filters = {}, context = {}) {
  const ttl = Number(process.env.PUBLIC_METRICS_CACHE_TTL_SECONDS || 300);
  const { data, hit } = await cache.getOrSet('public-metrics-bundle', filters, async () => {
    if (mockEnabled && mongoose.connection.readyState !== 1) {
      return {
        overview: mock.overview,
        stageCounts: mock.stageCounts,
        departmentTurnaround: mock.departmentTurnaround,
        approvalRates: mock.approvalRates,
        certificateMetrics: mock.certificateMetrics,
        grievanceMetrics: mock.grievanceMetrics,
        monthlyApplications: mock.monthlyApplications
      };
    }
    const [overviewDocs, stageRaw, departmentRaw, approvalRaw, certificateRaw, grievanceRaw, monthlyRaw] = await Promise.all([
      repository.getOverviewMetrics(filters, context),
      repository.getApplicationStageCounts(filters, context),
      repository.getDepartmentTurnaroundMetrics(filters, context),
      repository.getApprovalRateMetrics(filters, context),
      repository.getCertificateIssuanceMetrics(filters, context),
      repository.getGrievanceTrendMetrics(filters, context),
      repository.getMonthlyApplicationTrend(filters, context)
    ]);
    const overview = buildOverviewFromDocs(overviewDocs);
    return {
      overview,
      stageCounts: buildStageCounts(stageRaw),
      departmentTurnaround: buildDepartmentTurnaround(departmentRaw),
      approvalRates: buildApprovalRates(approvalRaw, overview),
      certificateMetrics: buildCertificateMetrics(certificateRaw),
      grievanceMetrics: buildGrievanceMetrics(grievanceRaw),
      monthlyApplications: monthlyRaw.length
        ? monthlyRaw.slice(-12).map((doc) => ({ month: doc.date, applicationsReceived: Number(doc.applicationsReceived || 0) }))
        : (mockEnabled ? mock.monthlyApplications : [])
    };
  }, ttl);

  return {
    ...data,
    meta: {
      cache: { hit, ttlSeconds: ttl },
      privacy: { piiExcluded: true, minGroupSize: MIN_GROUP_SIZE }
    }
  };
}

module.exports = { getPublicMetricsBundle };
