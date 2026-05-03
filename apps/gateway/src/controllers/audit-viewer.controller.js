const auditService = require('../../../../services/audit-service/src/services/audit.service');

async function listEvents(req, res) {
  const data = await auditService.searchAuditEvents(req.query || {}, {
    page: req.query.page || 1,
    limit: req.query.limit || 50
  }, {});
  res.json({ success: true, data, error: null });
}

async function getEvent(req, res) {
  const data = await auditService.searchAuditEvents({ eventId: req.params.eventId }, { page: 1, limit: 1 }, {});
  if (!data.items.length) return res.status(404).json({ success: false, data: null, error: { message: 'Audit event not found' } });
  res.json({ success: true, data: data.items[0], error: null });
}

async function getCase(req, res) {
  const data = await auditService.getCaseAuditTrail(req.params.universalCaseId, {
    pagination: { page: req.query.page || 1, limit: req.query.limit || 200 }
  });
  res.json({ success: true, data, error: null });
}

async function verifyIntegrity(req, res) {
  const data = await auditService.verifyAuditIntegrity(req.body?.filter || {}, {});
  res.json({ success: true, data, error: null });
}

module.exports = {
  listEvents,
  getEvent,
  getCase,
  verifyIntegrity
};
