const mongoose = require('mongoose');
const Case = require('../models/Case');
const ApprovalTask = require('../models/ApprovalTask');
const Document = require('../models/Document');
const Grievance = require('../models/Grievance');
const SlaTimer = require('../models/SlaTimer');
const Comment = require('../models/Comment');
const Inspection = require('../models/Inspection');
const Fee = require('../models/Fee');
const Certificate = require('../models/Certificate');

const MAX_RANGE_DAYS = Number(process.env.ANALYTICS_MAX_DATE_RANGE_DAYS || 730);

function toDateRange(dateRange = {}) {
  const from = dateRange.fromDate ? new Date(dateRange.fromDate) : new Date(Date.now() - 90 * 86400000);
  const to = dateRange.toDate ? new Date(dateRange.toDate) : new Date();
  const spanDays = Math.ceil((to.getTime() - from.getTime()) / 86400000);
  if (spanDays > MAX_RANGE_DAYS) {
    const error = new Error(`Date range exceeds ${MAX_RANGE_DAYS} days.`);
    error.status = 400;
    throw error;
  }
  return { from, to };
}

function ensureDb() {
  if (mongoose.connection.readyState !== 1) return false;
  return true;
}

function hoursBetween(start, end) {
  if (!start || !end) return null;
  return (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
}

async function aggregateDailyRollup(dateRange = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  const rows = await Case.aggregate([
    { $match: { isDeleted: false, createdAt: { $gte: from, $lte: to }, status: { $ne: 'draft' } } },
    {
      $group: {
        _id: {
          date: { $dateTrunc: { date: '$createdAt', unit: 'day' } },
          departmentCode: '$departmentCode'
        },
        applicationsReceived: { $sum: 1 },
        applicationsSubmitted: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_scrutiny', 'approved', 'rejected', 'closed']] }, 1, 0] } },
        applicationsApproved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        applicationsRejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        applicationsClosed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        activeCases: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_scrutiny', 'query_raised', 'inspection_scheduled', 'fee_demanded', 'fee_paid']] }, 1, 0] } }
      }
    },
    { $project: { _id: 0, date: '$_id.date', departmentCode: '$_id.departmentCode', applicationsReceived: 1, applicationsSubmitted: 1, applicationsApproved: 1, applicationsRejected: 1, applicationsClosed: 1, activeCases: 1 } }
  ]);
  return rows.map((row) => ({ ...row, granularity: 'daily', scopeType: 'department', scopeId: row.departmentCode || 'unknown' }));
}

async function aggregateDepartmentTurnaround(dateRange = {}, filters = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  const tasks = await ApprovalTask.find({
    isDeleted: false,
    createdAt: { $gte: from, $lte: to },
    ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {})
  }).lean();

  const grouped = new Map();
  for (const task of tasks) {
    const key = task.departmentCode || 'unknown';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(task);
  }

  return Array.from(grouped.entries()).map(([departmentCode, items]) => {
    const completed = items.filter((t) => ['approved', 'rejected', 'returned', 'closed'].includes(t.status));
    const durations = completed.map((t) => hoursBetween(t.createdAt, t.completedAt || t.updatedAt)).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    const averageTurnaroundHours = durations.length ? Number((durations.reduce((s, n) => s + n, 0) / durations.length).toFixed(2)) : 0;
    const medianTurnaroundHours = durations.length ? Number(durations[Math.floor(durations.length / 2)].toFixed(2)) : 0;
    const p75TurnaroundHours = durations.length ? Number(durations[Math.floor(durations.length * 0.75)].toFixed(2)) : 0;
    const p90TurnaroundHours = durations.length ? Number(durations[Math.floor(durations.length * 0.9)].toFixed(2)) : 0;
    const pendingTasks = items.filter((t) => !['approved', 'rejected', 'returned', 'closed'].includes(t.status)).length;
    const approvedTasks = items.filter((t) => t.status === 'approved').length;
    const rejectedTasks = items.filter((t) => t.status === 'rejected').length;
    const returnedTasks = items.filter((t) => t.status === 'returned').length;
    const slaWarningCount = items.filter((t) => t.slaState === 'warning').length;
    const slaBreachCount = items.filter((t) => t.slaState === 'breached').length;
    const completedTasks = completed.length;
    const totalTasks = items.length;
    const slaComplianceRate = completedTasks ? Number((((completedTasks - slaBreachCount) / completedTasks) * 100).toFixed(2)) : 100;
    return {
      departmentCode,
      periodStart: from,
      periodEnd: to,
      totalTasks,
      completedTasks,
      pendingTasks,
      approvedTasks,
      rejectedTasks,
      returnedTasks,
      averageTurnaroundHours,
      medianTurnaroundHours,
      p75TurnaroundHours,
      p90TurnaroundHours,
      slaWarningCount,
      slaBreachCount,
      slaComplianceRate,
      ageingBuckets: {},
      stageBreakdown: {},
      bottleneckScore: Math.min(100, Number(((pendingTasks / Math.max(totalTasks, 1)) * 70 + slaBreachCount * 3).toFixed(2))),
      metadata: { source: 'approval_tasks_aggregation' }
    };
  });
}

async function aggregateBottlenecks(dateRange = {}, filters = {}, _context = {}) {
  const turnaround = await aggregateDepartmentTurnaround(dateRange, filters);
  return turnaround
    .filter((row) => row.bottleneckScore >= 25 || row.slaBreachCount > 0)
    .map((row, index) => ({
      bottleneckId: `BTL-${row.departmentCode}-${new Date(row.periodEnd).toISOString().slice(0, 10)}-${index + 1}`,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      scopeType: 'department',
      scopeId: row.departmentCode,
      departmentCode: row.departmentCode,
      stage: 'department_queue',
      caseType: 'all',
      severity: row.bottleneckScore >= 75 ? 'critical' : row.bottleneckScore >= 55 ? 'high' : row.bottleneckScore >= 35 ? 'medium' : 'low',
      bottleneckScore: row.bottleneckScore,
      affectedCaseCount: row.pendingTasks,
      averageWaitHours: row.averageTurnaroundHours,
      medianWaitHours: row.medianTurnaroundHours,
      p90WaitHours: row.p90TurnaroundHours,
      oldestPendingHours: row.p90TurnaroundHours,
      slaBreachCount: row.slaBreachCount,
      queueDepth: row.pendingTasks,
      trendDirection: 'flat',
      likelyCause: row.pendingTasks > row.completedTasks ? 'Backlog growing faster than completions.' : 'Elevated SLA breaches.',
      recommendedAction: 'Assign additional reviewers and clear oldest pending tasks first.',
      evidence: { pendingTasks: row.pendingTasks, completedTasks: row.completedTasks, slaBreaches: row.slaBreachCount },
      status: 'open',
      detectedAt: new Date()
    }));
}

async function aggregateDocumentDefects(dateRange = {}, filters = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  return Document.aggregate([
    {
      $match: {
        isDeleted: false,
        updatedAt: { $gte: from, $lte: to },
        status: 'rejected',
        ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {})
      }
    },
    {
      $group: {
        _id: {
          documentType: '$documentType',
          departmentCode: '$departmentCode',
          defectReason: { $ifNull: ['$rejection.reason', 'other'] }
        },
        occurrenceCount: { $sum: 1 },
        affectedCases: { $addToSet: '$caseId' }
      }
    },
    {
      $project: {
        _id: 0,
        defectId: { $concat: [{ $ifNull: ['$_id.departmentCode', 'unknown'] }, '-', { $ifNull: ['$_id.documentType', 'unknown'] }, '-', { $substr: ['$_id.defectReason', 0, 20] }] },
        periodStart: from,
        periodEnd: to,
        documentType: '$_id.documentType',
        departmentCode: '$_id.departmentCode',
        defectReason: '$_id.defectReason',
        occurrenceCount: 1,
        affectedCaseCount: { $size: '$affectedCases' }
      }
    }
  ]).then((rows) =>
    rows.map((row) => ({
      ...row,
      defectCategory: 'other',
      rejectionRate: 0,
      averageCorrectionTimeHours: 0,
      repeatedByOrganisationCount: 0,
      trendDirection: 'flat',
      severity: row.occurrenceCount > 15 ? 'high' : row.occurrenceCount > 5 ? 'medium' : 'low',
      examples: [],
      recommendedAction: 'Update document guidance and validation checks.',
      metadata: {}
    }))
  );
}

async function aggregateRejectionReasons(dateRange = {}, filters = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  return ApprovalTask.aggregate([
    { $match: { isDeleted: false, status: 'rejected', updatedAt: { $gte: from, $lte: to }, ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {}) } },
    {
      $group: {
        _id: {
          departmentCode: '$departmentCode',
          caseType: '$caseType',
          taskType: '$taskType',
          rejectionCategory: { $ifNull: ['$decision.rejectionCategory', 'other'] },
          rejectionReason: { $ifNull: ['$decision.reason', 'Not specified'] }
        },
        rejectionCount: { $sum: 1 },
        affectedCases: { $addToSet: '$caseId' }
      }
    },
    {
      $project: {
        _id: 0,
        periodStart: from,
        periodEnd: to,
        departmentCode: '$_id.departmentCode',
        caseType: { $ifNull: ['$_id.caseType', 'unknown'] },
        taskType: { $ifNull: ['$_id.taskType', 'unknown'] },
        rejectionCategory: '$_id.rejectionCategory',
        rejectionReason: '$_id.rejectionReason',
        rejectionCount: 1,
        affectedCaseCount: { $size: '$affectedCases' }
      }
    }
  ]).then((rows) => rows.map((row) => ({ ...row, percentageOfRejections: 0, trendDirection: 'flat', examples: [], metadata: {} })));
}

async function aggregateQueryAgeing(dateRange = {}, filters = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  const tasks = await ApprovalTask.find({
    isDeleted: false,
    updatedAt: { $gte: from, $lte: to },
    ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {})
  }).lean();
  const byDept = new Map();
  for (const task of tasks) {
    const departmentCode = task.departmentCode || 'unknown';
    if (!byDept.has(departmentCode)) byDept.set(departmentCode, []);
    byDept.get(departmentCode).push(task);
  }
  return Array.from(byDept.entries()).map(([departmentCode, rows]) => {
    const openQueries = rows.filter((r) => r.status === 'query_raised').length;
    const respondedQueries = rows.filter((r) => r.status === 'response_submitted').length;
    const overdueQueries = rows.filter((r) => r.status === 'query_raised' && r.queryDueAt && new Date(r.queryDueAt) < new Date()).length;
    return {
      periodStart: from,
      periodEnd: to,
      departmentCode,
      queryType: 'task_query',
      openQueries,
      respondedQueries,
      overdueQueries,
      averageAgeHours: 0,
      medianAgeHours: 0,
      oldestAgeHours: 0,
      averageResponseHours: 0,
      ageingBuckets: { '0_2_days': 0, '3_7_days': 0, '8_15_days': 0, '16_30_days': 0, '31_plus_days': 0 },
      slaBreachCount: overdueQueries,
      metadata: {}
    };
  });
}

async function aggregateOfficerWorkload(dateRange = {}, filters = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  const tasks = await ApprovalTask.find({ isDeleted: false, createdAt: { $gte: from, $lte: to }, ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {}) }).lean();
  const group = new Map();
  for (const task of tasks) {
    const officerUserId = String(task.assignedOfficerId || 'unassigned');
    const key = `${task.departmentCode || 'unknown'}::${officerUserId}`;
    if (!group.has(key)) group.set(key, { departmentCode: task.departmentCode || 'unknown', officerUserId, tasks: [] });
    group.get(key).tasks.push(task);
  }
  return Array.from(group.values()).map((entry) => {
    const total = entry.tasks.length;
    const completedTaskCount = entry.tasks.filter((t) => ['approved', 'rejected', 'returned', 'closed'].includes(t.status)).length;
    const activeTaskCount = total - completedTaskCount;
    const overdueTaskCount = entry.tasks.filter((t) => t.slaState === 'breached').length;
    const approvalCount = entry.tasks.filter((t) => t.status === 'approved').length;
    const rejectionCount = entry.tasks.filter((t) => t.status === 'rejected').length;
    const queryRaisedCount = entry.tasks.filter((t) => t.status === 'query_raised').length;
    const workloadScore = Math.min(100, Number((activeTaskCount * 4 + overdueTaskCount * 8 + total).toFixed(2)));
    return {
      periodStart: from,
      periodEnd: to,
      departmentCode: entry.departmentCode,
      officerUserId: entry.officerUserId,
      officerDisplayName: null,
      officerRole: 'department_officer',
      assignedTaskCount: total,
      activeTaskCount,
      completedTaskCount,
      overdueTaskCount,
      averageHandlingHours: 0,
      approvalCount,
      rejectionCount,
      queryRaisedCount,
      inspectionHandledCount: 0,
      workloadScore,
      imbalanceFlag: workloadScore >= 70,
      metadata: {}
    };
  });
}

async function aggregateEscalationFrequency(dateRange = {}, filters = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  const timers = await SlaTimer.find({
    createdAt: { $gte: from, $lte: to },
    ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {})
  }).lean();
  const byKey = new Map();
  for (const timer of timers) {
    for (const event of timer.escalationHistory || []) {
      const key = `${timer.departmentCode || 'unknown'}::${event.level || timer.escalationLevel || 1}`;
      const existing = byKey.get(key) || { count: 0, entities: new Set(), reasons: [] };
      existing.count += 1;
      existing.entities.add(String(timer.caseId || timer.taskId || timer.grievanceId || timer._id));
      if (event.reason) existing.reasons.push(event.reason);
      byKey.set(key, existing);
    }
  }
  return Array.from(byKey.entries()).map(([key, value]) => {
    const [departmentCode, level] = key.split('::');
    return {
      periodStart: from,
      periodEnd: to,
      departmentCode,
      escalationType: 'sla',
      escalationLevel: Number(level),
      escalationCount: value.count,
      affectedCaseCount: value.entities.size,
      averageTimeToEscalationHours: 0,
      repeatedEntities: Array.from(value.entities).slice(0, 20),
      topReasons: value.reasons.slice(0, 10),
      resolutionRate: 0,
      metadata: {}
    };
  });
}

function maskName(name = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'Organisation ****';
  if (trimmed.length <= 4) return `${trimmed[0] || 'O'}***`;
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-1)}`;
}

async function aggregateInvestorHistory(dateRange = {}, filters = {}, _context = {}) {
  if (!ensureDb()) return [];
  const { from, to } = toDateRange(dateRange);
  const cases = await Case.find({
    isDeleted: false,
    createdAt: { $gte: from, $lte: to },
    status: { $ne: 'draft' }
  }).lean();
  const grouped = new Map();
  for (const c of cases) {
    const key = String(c.organisationId || c.investorId || c._id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(c);
  }
  return Array.from(grouped.entries()).map(([orgId, rows]) => {
    const totalCases = rows.length;
    const activeCases = rows.filter((r) => ['submitted', 'under_scrutiny', 'query_raised', 'inspection_scheduled', 'fee_demanded', 'fee_paid'].includes(r.status)).length;
    const approvedCases = rows.filter((r) => r.status === 'approved').length;
    const rejectedCases = rows.filter((r) => r.status === 'rejected').length;
    const withdrawnCases = rows.filter((r) => r.status === 'withdrawn').length;
    const riskFlags = [];
    if (rejectedCases >= 3) riskFlags.push('repeated_rejections');
    if (activeCases >= 5) riskFlags.push('long_pending_cases');
    return {
      investorId: String(rows[0].investorId || ''),
      organisationId: orgId,
      organisationDisplayName: rows[0].organisationName || null,
      maskedOrganisationName: maskName(rows[0].organisationName || `Org-${orgId}`),
      sector: rows[0].sector || null,
      district: rows[0].district || null,
      totalCases,
      activeCases,
      approvedCases,
      rejectedCases,
      withdrawnCases,
      certificatesIssued: approvedCases,
      grievancesRaised: 0,
      documentsRejected: 0,
      averageTurnaroundHours: 0,
      repeatDefectCount: 0,
      riskFlags,
      lastApplicationAt: rows.reduce((latest, row) => (new Date(row.createdAt) > new Date(latest || 0) ? row.createdAt : latest), null),
      lastActivityAt: rows.reduce((latest, row) => (new Date(row.updatedAt) > new Date(latest || 0) ? row.updatedAt : latest), null),
      metadata: {}
    };
  }).filter((row) => !filters.sector || row.sector === filters.sector);
}

module.exports = {
  aggregateDailyRollup,
  aggregateDepartmentTurnaround,
  aggregateBottlenecks,
  aggregateDocumentDefects,
  aggregateRejectionReasons,
  aggregateQueryAgeing,
  aggregateOfficerWorkload,
  aggregateEscalationFrequency,
  aggregateInvestorHistory
};
