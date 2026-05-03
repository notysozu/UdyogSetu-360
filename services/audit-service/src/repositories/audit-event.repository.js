const AuditEvent = require('../models/AuditEvent');
const AuditSequence = require('../models/AuditSequence');
const { verifyAuditChain } = require('../services/audit-hash.service');

async function nextAuditSequence(session) {
  const updated = await AuditSequence.findOneAndUpdate(
    { key: 'auditSequence' },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return updated.value;
}

async function appendAuditEvent(input, _context = {}, session = null) {
  const [created] = await AuditEvent.create([input], session ? { session } : {});
  return created;
}

async function findAuditEvents(filter = {}, pagination = {}) {
  const page = Math.max(Number(pagination.page) || 1, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || 25, 1), 200);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditEvent.countDocuments(filter)
  ]);
  return { items, total, page, limit };
}

function findByEventId(eventId) {
  return AuditEvent.findOne({ eventId }).lean();
}

function findByCase(universalCaseId, pagination = {}) {
  return findAuditEvents({ universalCaseId }, pagination);
}

function findByResource(resourceType, resourceId, pagination = {}) {
  return findAuditEvents({ resourceType, resourceId }, pagination);
}

function findLatestByResource(resourceType, resourceId) {
  return AuditEvent.findOne({ resourceType, resourceId }).sort({ auditSequence: -1 });
}

function verifyChain(filter = {}) {
  return verifyAuditChain(filter);
}

async function exportAuditEvents(filter = {}, options = {}) {
  const limit = Math.min(Number(options.limit) || 5000, Number(process.env.AUDIT_EXPORT_MAX_ROWS || 10000));
  return AuditEvent.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = {
  nextAuditSequence,
  appendAuditEvent,
  findAuditEvents,
  findByEventId,
  findByCase,
  findByResource,
  findLatestByResource,
  verifyChain,
  exportAuditEvents
};
