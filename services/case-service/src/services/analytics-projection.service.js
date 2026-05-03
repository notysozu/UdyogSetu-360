const AnalyticsDailyRollup = require('../models/AnalyticsDailyRollup');
const DepartmentTurnaroundProjection = require('../models/DepartmentTurnaroundProjection');
const BottleneckProjection = require('../models/BottleneckProjection');
const DocumentDefectProjection = require('../models/DocumentDefectProjection');
const RejectionReasonProjection = require('../models/RejectionReasonProjection');
const QueryAgeingProjection = require('../models/QueryAgeingProjection');
const OfficerWorkloadProjection = require('../models/OfficerWorkloadProjection');
const EscalationFrequencyProjection = require('../models/EscalationFrequencyProjection');
const InvestorHistoryProjection = require('../models/InvestorHistoryProjection');
const aggregationService = require('./analytics-aggregation.service');
const cache = require('./analytics-cache.service');

async function bulkUpsert(Model, rows = [], matchFields = []) {
  if (!rows.length) return { upserted: 0 };
  const ops = rows.map((row) => {
    const filter = {};
    for (const field of matchFields) filter[field] = row[field];
    return { updateOne: { filter, update: { $set: row }, upsert: true } };
  });
  await Model.bulkWrite(ops, { ordered: false });
  return { upserted: rows.length };
}

function getRange(dateRange = {}) {
  return {
    fromDate: dateRange.fromDate || new Date(Date.now() - Number(process.env.ANALYTICS_DEFAULT_LOOKBACK_DAYS || 90) * 86400000),
    toDate: dateRange.toDate || new Date()
  };
}

async function upsertDailyRollup(records, _context = {}) {
  return bulkUpsert(AnalyticsDailyRollup, records, ['date', 'granularity', 'scopeType', 'scopeId', 'departmentCode']);
}
async function upsertDepartmentTurnaround(records, _context = {}) {
  return bulkUpsert(DepartmentTurnaroundProjection, records, ['departmentCode', 'periodStart', 'periodEnd']);
}
async function upsertBottleneckProjection(records, _context = {}) {
  return bulkUpsert(BottleneckProjection, records, ['bottleneckId']);
}
async function upsertDocumentDefectProjection(records, _context = {}) {
  return bulkUpsert(DocumentDefectProjection, records, ['defectId', 'periodStart', 'periodEnd']);
}
async function upsertRejectionReasonProjection(records, _context = {}) {
  return bulkUpsert(RejectionReasonProjection, records, ['departmentCode', 'periodStart', 'periodEnd', 'rejectionCategory', 'rejectionReason']);
}
async function upsertQueryAgeingProjection(records, _context = {}) {
  return bulkUpsert(QueryAgeingProjection, records, ['departmentCode', 'periodStart', 'periodEnd', 'queryType']);
}
async function upsertOfficerWorkloadProjection(records, _context = {}) {
  return bulkUpsert(OfficerWorkloadProjection, records, ['departmentCode', 'officerUserId', 'periodStart', 'periodEnd']);
}
async function upsertEscalationFrequencyProjection(records, _context = {}) {
  return bulkUpsert(EscalationFrequencyProjection, records, ['departmentCode', 'escalationType', 'escalationLevel', 'periodStart', 'periodEnd']);
}
async function upsertInvestorHistoryProjection(records, _context = {}) {
  return bulkUpsert(InvestorHistoryProjection, records, ['organisationId']);
}

async function rebuildProjection(projectionName, dateRange = {}, context = {}) {
  const range = getRange(dateRange);
  switch (projectionName) {
    case 'daily_rollup':
      return upsertDailyRollup(await aggregationService.aggregateDailyRollup(range, context), context);
    case 'department_turnaround':
      return upsertDepartmentTurnaround(await aggregationService.aggregateDepartmentTurnaround(range, {}, context), context);
    case 'bottlenecks':
      return upsertBottleneckProjection(await aggregationService.aggregateBottlenecks(range, {}, context), context);
    case 'document_defects':
      return upsertDocumentDefectProjection(await aggregationService.aggregateDocumentDefects(range, {}, context), context);
    case 'rejection_reasons':
      return upsertRejectionReasonProjection(await aggregationService.aggregateRejectionReasons(range, {}, context), context);
    case 'query_ageing':
      return upsertQueryAgeingProjection(await aggregationService.aggregateQueryAgeing(range, {}, context), context);
    case 'officer_workload':
      return upsertOfficerWorkloadProjection(await aggregationService.aggregateOfficerWorkload(range, {}, context), context);
    case 'escalation_frequency':
      return upsertEscalationFrequencyProjection(await aggregationService.aggregateEscalationFrequency(range, {}, context), context);
    case 'investor_history':
      return upsertInvestorHistoryProjection(await aggregationService.aggregateInvestorHistory(range, {}, context), context);
    default: {
      const error = new Error('Unsupported projectionName.');
      error.status = 400;
      throw error;
    }
  }
}

async function rebuildAllProjections(dateRange = {}, context = {}) {
  const range = getRange(dateRange);
  const summary = {};
  summary.dailyRollup = await upsertDailyRollup(await aggregationService.aggregateDailyRollup(range, context), context);
  summary.departmentTurnaround = await upsertDepartmentTurnaround(await aggregationService.aggregateDepartmentTurnaround(range, {}, context), context);
  summary.bottlenecks = await upsertBottleneckProjection(await aggregationService.aggregateBottlenecks(range, {}, context), context);
  summary.documentDefects = await upsertDocumentDefectProjection(await aggregationService.aggregateDocumentDefects(range, {}, context), context);
  summary.rejectionReasons = await upsertRejectionReasonProjection(await aggregationService.aggregateRejectionReasons(range, {}, context), context);
  summary.queryAgeing = await upsertQueryAgeingProjection(await aggregationService.aggregateQueryAgeing(range, {}, context), context);
  summary.officerWorkload = await upsertOfficerWorkloadProjection(await aggregationService.aggregateOfficerWorkload(range, {}, context), context);
  summary.escalationFrequency = await upsertEscalationFrequencyProjection(await aggregationService.aggregateEscalationFrequency(range, {}, context), context);
  summary.investorHistory = await upsertInvestorHistoryProjection(await aggregationService.aggregateInvestorHistory(range, {}, context), context);
  cache.invalidate('analytics');
  return summary;
}

module.exports = {
  rebuildAllProjections,
  rebuildProjection,
  upsertDailyRollup,
  upsertDepartmentTurnaround,
  upsertBottleneckProjection,
  upsertDocumentDefectProjection,
  upsertRejectionReasonProjection,
  upsertQueryAgeingProjection,
  upsertOfficerWorkloadProjection,
  upsertEscalationFrequencyProjection,
  upsertInvestorHistoryProjection
};
