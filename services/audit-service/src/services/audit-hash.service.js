const crypto = require('crypto');
const AuditEvent = require('../models/AuditEvent');

function canonicaliseAuditPayload(auditEvent = {}) {
  return JSON.stringify({
    eventId: auditEvent.eventId,
    auditSequence: auditEvent.auditSequence,
    actor: auditEvent.actor || null,
    action: auditEvent.action || null,
    resourceType: auditEvent.resourceType || null,
    resourceId: auditEvent.resourceId || null,
    caseId: auditEvent.caseId || null,
    universalCaseId: auditEvent.universalCaseId || null,
    taskId: auditEvent.taskId || null,
    grievanceId: auditEvent.grievanceId || null,
    departmentCode: auditEvent.departmentCode || null,
    correlationId: auditEvent.correlationId || null,
    requestId: auditEvent.requestId || null,
    traceId: auditEvent.traceId || null,
    reason: auditEvent.reason || null,
    outcome: auditEvent.outcome || null,
    metadata: auditEvent.metadata || null,
    createdAt: auditEvent.createdAt || null
  });
}

function computeAuditHash(auditPayload, previousHash = null) {
  const canonical = typeof auditPayload === 'string' ? auditPayload : canonicaliseAuditPayload(auditPayload);
  return crypto.createHash('sha256').update(`${previousHash || ''}|${canonical}`).digest('hex');
}

async function getPreviousAuditHash() {
  const previous = await AuditEvent.findOne().sort({ auditSequence: -1 }).lean();
  return previous?.currentHash || null;
}

function verifyAuditHash(event) {
  const expected = computeAuditHash(canonicaliseAuditPayload(event), event.previousHash || null);
  return expected === event.currentHash;
}

async function verifyAuditChain(filter = {}) {
  const events = await AuditEvent.find(filter).sort({ auditSequence: 1 }).lean();
  const issues = [];
  let previousHash = null;
  for (const event of events) {
    const expected = computeAuditHash(canonicaliseAuditPayload(event), previousHash);
    if (event.currentHash !== expected) {
      issues.push({ eventId: event.eventId, auditSequence: event.auditSequence, expected, actual: event.currentHash });
    }
    previousHash = event.currentHash;
  }
  return {
    ok: issues.length === 0,
    checked: events.length,
    issues
  };
}

function repairHashChainForbidden() {
  throw new Error('Hash chain repair is forbidden for legal audit records.');
}

module.exports = {
  canonicaliseAuditPayload,
  computeAuditHash,
  getPreviousAuditHash,
  verifyAuditHash,
  verifyAuditChain,
  repairHashChainForbidden
};
