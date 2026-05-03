const { randomUUID, createHash } = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const auditEventRepository = require('../repositories/audit-event.repository');
const { canonicaliseAuditPayload, computeAuditHash } = require('./audit-hash.service');
const AuditExport = require('../models/AuditExport');

function hashSafe(value = '') {
  return createHash('sha256').update(String(value)).digest('hex');
}

async function recordAuditEvent(input, context = {}) {
  const auditSequence = await auditEventRepository.nextAuditSequence(context.session || null);
  const previous = await auditEventRepository.findLatestByResource(input.resourceType, input.resourceId);
  const previousHash = previous?.currentHash || null;
  const eventPayload = {
    eventId: input.eventId || randomUUID(),
    auditSequence,
    actor: input.actor || { actorType: 'system', actorId: 'unknown', role: 'system', serviceName: 'unknown' },
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    taskId: input.taskId || null,
    grievanceId: input.grievanceId || null,
    departmentCode: input.departmentCode || null,
    correlationId: input.correlationId || context.correlationId || null,
    requestId: input.requestId || context.requestId || null,
    traceId: input.traceId || context.traceId || null,
    ipAddressHash: input.ipAddress ? hashSafe(input.ipAddress) : null,
    userAgentHash: input.userAgent ? hashSafe(input.userAgent) : null,
    before: input.before || null,
    after: input.after || null,
    reason: input.reason || null,
    outcome: input.outcome || { success: true, failure: false, denied: false },
    metadata: input.metadata || {},
    previousHash,
    hashAlgorithm: 'sha256',
    createdAt: new Date()
  };
  eventPayload.currentHash = computeAuditHash(canonicaliseAuditPayload(eventPayload), previousHash);
  return auditEventRepository.appendAuditEvent(eventPayload, context, context.session || null);
}

function recordAccessDenied(input, context = {}) {
  return recordAuditEvent({
    ...input,
    action: input.action || 'auth.access_denied',
    outcome: { success: false, failure: false, denied: true }
  }, context);
}

function recordReplayAttempt(input, context = {}) {
  return recordAuditEvent({
    ...input,
    action: input.action || 'replay.requested'
  }, context);
}

function recordExportAttempt(input, context = {}) {
  return recordAuditEvent({
    ...input,
    action: input.action || 'audit.export_requested'
  }, context);
}

function searchAuditEvents(filter = {}, pagination = {}, _context = {}) {
  return auditEventRepository.findAuditEvents(filter, pagination);
}

function getCaseAuditTrail(universalCaseId, context = {}) {
  return auditEventRepository.findByCase(universalCaseId, context.pagination || { page: 1, limit: 200 });
}

function verifyAuditIntegrity(filter = {}, _context = {}) {
  return auditEventRepository.verifyChain(filter);
}

async function exportAuditTrail(filter = {}, format = 'json', context = {}) {
  const rows = await auditEventRepository.exportAuditEvents(filter, { limit: context.limit || process.env.AUDIT_EXPORT_MAX_ROWS });
  const exportId = randomUUID();
  const exportsDir = path.resolve(process.cwd(), process.env.EXPORTS_DIR || 'exports');
  await fs.mkdir(exportsDir, { recursive: true });
  const filePath = path.join(exportsDir, `audit-export-${exportId}.${format === 'csv' ? 'csv' : 'json'}`);
  if (format === 'csv') {
    const header = ['auditSequence', 'eventId', 'createdAt', 'actorId', 'action', 'resourceType', 'resourceId', 'universalCaseId', 'correlationId', 'previousHash', 'currentHash'];
    const lines = [header.join(',')];
    rows.forEach((row) => {
      lines.push([
        row.auditSequence,
        row.eventId,
        row.createdAt?.toISOString?.() || row.createdAt,
        row.actor?.actorId || '',
        row.action,
        row.resourceType,
        row.resourceId,
        row.universalCaseId || '',
        row.correlationId || '',
        row.previousHash || '',
        row.currentHash || ''
      ].map((item) => `"${String(item ?? '').replaceAll('"', '""')}"`).join(','));
    });
    await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
  } else {
    await fs.writeFile(filePath, JSON.stringify(rows, null, 2), 'utf8');
  }
  await AuditExport.create({
    exportId,
    requestedBy: context.userId || null,
    format,
    filter,
    status: 'completed',
    rowCount: rows.length,
    filePath,
    downloadUrl: null,
    includeSensitive: false,
    integrityVerified: false,
    correlationId: context.correlationId || null,
    createdAt: new Date(),
    completedAt: new Date()
  }).catch(() => null);
  await recordExportAttempt({
    actor: context.actor || { actorType: 'user', actorId: context.userId || null, role: context.role || null },
    resourceType: 'audit_export',
    resourceId: exportId,
    metadata: { format, filePath, filter, rowCount: rows.length }
  }, context);
  return { exportId, format, filePath, rowCount: rows.length };
}

function getAuditExport(exportId) {
  return AuditExport.findOne({ exportId }).lean();
}

module.exports = {
  recordAuditEvent,
  recordAccessDenied,
  recordReplayAttempt,
  recordExportAttempt,
  searchAuditEvents,
  getCaseAuditTrail,
  verifyAuditIntegrity,
  exportAuditTrail,
  getAuditExport,
  findAuditEvents: searchAuditEvents
};
