const auditService = require('../services/audit.service');

function contextFromRequest(req) {
  return {
    correlationId: req.get('x-correlation-id') || null,
    requestId: req.get('x-request-id') || null,
    traceId: req.get('traceparent') || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
    userId: req.get('x-user-id') || null,
    role: req.get('x-user-role') || null,
    actor: {
      actorType: 'user',
      actorId: req.get('x-user-id') || null,
      role: req.get('x-user-role') || null,
      serviceName: 'audit-service'
    }
  };
}

async function createEvent(req, res, next) {
  try {
    const event = await auditService.recordAuditEvent(req.body, contextFromRequest(req));
    res.status(201).json({ success: true, data: event, error: null });
  } catch (error) {
    next(error);
  }
}

async function listEvents(req, res, next) {
  try {
    const data = await auditService.searchAuditEvents(req.query.filter || {}, {
      page: req.query.page || 1,
      limit: req.query.limit || 50
    }, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function getEvent(req, res, next) {
  try {
    const data = await auditService.searchAuditEvents({ eventId: req.params.eventId }, { page: 1, limit: 1 }, contextFromRequest(req));
    if (!data.items.length) return res.status(404).json({ success: false, data: null, error: { message: 'Audit event not found' } });
    res.json({ success: true, data: data.items[0], error: null });
  } catch (error) {
    next(error);
  }
}

async function getCaseEvents(req, res, next) {
  try {
    const data = await auditService.getCaseAuditTrail(req.params.universalCaseId, {
      pagination: { page: req.query.page || 1, limit: req.query.limit || 200 }
    });
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function verifyIntegrity(req, res, next) {
  try {
    const data = await auditService.verifyAuditIntegrity(req.body?.filter || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function exportAudit(req, res, next) {
  try {
    const data = await auditService.exportAuditTrail(req.body?.filter || {}, req.body?.format || 'json', contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function getExport(req, res, next) {
  try {
    const data = await auditService.getAuditExport(req.params.exportId);
    if (!data) return res.status(404).json({ success: false, data: null, error: { message: 'Audit export not found.' } });
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  getCaseEvents,
  verifyIntegrity,
  exportAudit,
  getExport
};
