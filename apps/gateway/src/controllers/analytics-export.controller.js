const fs = require('fs');
const exportService = require('../../../../services/case-service/src/services/analytics-export.service');
const { sendAccepted, sendSuccess } = require('../utils/api-response');

function exportContext(req) {
  const actor = req.user || {};
  const permissions = new Set(actor.permissions || []);
  return {
    user: actor,
    userId: actor.id,
    role: actor.primaryRole || actor.role,
    includePiiAllowed: permissions.has('analytics.view_pii'),
    correlationId: req.context?.correlationId || req.correlationId,
    requestId: req.context?.requestId || req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function requestExport(req, res) {
  const ctx = exportContext(req);
  const job = await exportService.createExportJob(req.body || {}, ctx);
  exportService.processExportJob(job.exportId, ctx).catch(() => {});
  return sendAccepted(res, { exportId: job.exportId, status: job.status });
}

async function getExport(req, res) {
  const ctx = exportContext(req);
  const job = await exportService.getExportJob(req.params.exportId, ctx);
  if (!job) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Export not found.' } });
  if (job.status !== 'completed' || !job.filePath || !fs.existsSync(job.filePath)) {
    return sendSuccess(res, { exportId: job.exportId, status: job.status, rowCount: job.rowCount || 0 });
  }
  const ext = job.format === 'json' ? 'json' : job.format === 'html_print' ? 'html' : 'csv';
  res.setHeader('Content-Disposition', `attachment; filename="${job.exportId}.${ext}"`);
  res.setHeader('Content-Type', ext === 'json' ? 'application/json' : ext === 'html' ? 'text/html' : 'text/csv');
  return res.sendFile(job.filePath);
}

module.exports = { requestExport, getExport };
