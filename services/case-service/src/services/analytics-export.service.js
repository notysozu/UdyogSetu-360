const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const AnalyticsExportJob = require('../models/AnalyticsExportJob');
const queryService = require('./analytics-query.service');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

const EXPORT_MAX_ROWS = Number(process.env.ANALYTICS_EXPORT_MAX_ROWS || 50000);
const EXPORT_DIR = process.env.ANALYTICS_EXPORT_DIR || 'exports/analytics';

function toCsv(rows = []) {
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const cell = String(value ?? '');
    return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
  };
  return [columns.join(','), ...rows.map((row) => columns.map((c) => escapeCell(row[c])).join(','))].join('\n');
}

async function createExportJob(input, context = {}) {
  const exportId = `AX-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const job = await AnalyticsExportJob.create({
    exportId,
    requestedBy: context.userId || context.user?.id || 'system',
    requestedByRole: context.role || context.user?.primaryRole || 'admin',
    exportType: input.exportType,
    format: input.format,
    filters: input.filters || {},
    status: 'queued',
    correlationId: context.correlationId || null,
    metadata: { includePii: Boolean(input.includePii) }
  });
  await recordAuditEvent({
    actor: { actorType: 'user', actorId: context.userId || context.user?.id || null, role: context.role || context.user?.primaryRole || null },
    action: 'analytics.export_requested',
    resourceType: 'analytics_export',
    resourceId: exportId,
    correlationId: context.correlationId || null,
    metadata: { exportType: input.exportType, format: input.format }
  }, context).catch(() => {});
  return job.toObject();
}

async function resolveData(exportType, filters = {}, context = {}) {
  switch (exportType) {
    case 'overview':
      return [((await queryService.getManagementOverview(filters, context)).data || {})];
    case 'bottlenecks':
      return (await queryService.getBottleneckDashboard(filters, context)).data || [];
    case 'document_defects':
      return (await queryService.getDocumentDefectDashboard(filters, context)).data || [];
    case 'department_turnaround':
      return (await queryService.getDepartmentTurnaroundDashboard(filters, context)).data || [];
    case 'rejection_reasons':
      return (await queryService.getRejectionReasonDashboard(filters, context)).data || [];
    case 'query_ageing':
      return (await queryService.getQueryAgeingDashboard(filters, context)).data || [];
    case 'officer_workload':
      return (await queryService.getOfficerWorkloadDashboard(filters, context)).data || [];
    case 'escalation_frequency':
      return (await queryService.getEscalationFrequencyDashboard(filters, context)).data || [];
    case 'investor_history':
      return (await queryService.getInvestorHistoryDashboard(filters, context)).data || [];
    case 'review_pack':
      return [await queryService.getReviewCommitteePack(filters, context)];
    default:
      return [];
  }
}

async function exportToCsv(data, _columns, _context = {}) {
  return toCsv(data);
}
async function exportToJson(data, _context = {}) {
  return JSON.stringify(data, null, 2);
}
async function exportToHtmlPrint(data, _context = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Analytics Export</title></head><body><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
}

async function processExportJob(exportId, context = {}) {
  const job = await AnalyticsExportJob.findOne({ exportId });
  if (!job) throw new Error('Export job not found.');
  job.status = 'processing';
  await job.save();

  try {
    const rows = await resolveData(job.exportType, job.filters || {}, { ...context, includePii: Boolean(job.metadata?.includePii) });
    const trimmed = Array.isArray(rows) ? rows.slice(0, EXPORT_MAX_ROWS) : [rows];
    const payload =
      job.format === 'json'
        ? await exportToJson(trimmed, context)
        : job.format === 'html_print'
          ? await exportToHtmlPrint(trimmed, context)
          : await exportToCsv(trimmed, null, context);
    const ext = job.format === 'json' ? 'json' : job.format === 'html_print' ? 'html' : 'csv';
    const dir = path.resolve(EXPORT_DIR);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${job.exportId}.${ext}`);
    fs.writeFileSync(filePath, payload);
    job.status = 'completed';
    job.rowCount = trimmed.length;
    job.filePath = filePath;
    job.downloadUrl = `/api/v1/analytics/exports/${job.exportId}`;
    job.completedAt = new Date();
    await job.save();
    await recordAuditEvent({
      actor: { actorType: 'user', actorId: context.userId || context.user?.id || null, role: context.role || context.user?.primaryRole || null },
      action: 'analytics.export_completed',
      resourceType: 'analytics_export',
      resourceId: exportId,
      correlationId: context.correlationId || null,
      metadata: { rowCount: trimmed.length, format: job.format }
    }, context).catch(() => {});
    return job.toObject();
  } catch (error) {
    job.status = 'failed';
    job.failureReason = error.message;
    await job.save();
    await recordAuditEvent({
      actor: { actorType: 'user', actorId: context.userId || context.user?.id || null, role: context.role || context.user?.primaryRole || null },
      action: 'analytics.export_failed',
      resourceType: 'analytics_export',
      resourceId: exportId,
      correlationId: context.correlationId || null,
      metadata: { reason: error.message }
    }, context).catch(() => {});
    throw error;
  }
}

async function getExportJob(exportId, _context = {}) {
  return AnalyticsExportJob.findOne({ exportId }).lean();
}

async function listExportJobs(user, filters = {}, _context = {}) {
  const role = user?.primaryRole || user?.role;
  const query = {};
  if (role === 'auditor') query.requestedByRole = { $in: ['admin', 'auditor'] };
  if (filters.status) query.status = filters.status;
  return AnalyticsExportJob.find(query).sort({ createdAt: -1 }).limit(100).lean();
}

module.exports = {
  createExportJob,
  processExportJob,
  exportToCsv,
  exportToJson,
  exportToHtmlPrint,
  getExportJob,
  listExportJobs
};
