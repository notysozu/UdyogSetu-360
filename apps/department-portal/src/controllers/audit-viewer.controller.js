const auditService = require('../../../../services/audit-service/src/services/audit.service');

function ensureAuditRole(req) {
  const role = req.user?.primaryRole || req.user?.role;
  if (!['admin', 'auditor'].includes(role)) {
    const error = new Error('Access denied');
    error.status = 403;
    throw error;
  }
}

function ctx(req) {
  return {
    correlationId: req.correlationId || null,
    userId: req.user?.id || req.user?._id || null,
    role: req.user?.primaryRole || req.user?.role || null,
    actor: {
      actorType: 'user',
      actorId: req.user?.id || req.user?._id || null,
      role: req.user?.primaryRole || req.user?.role || null,
      serviceName: 'department-portal'
    }
  };
}

async function auditDashboard(req, res) {
  ensureAuditRole(req);
  const events = await auditService.searchAuditEvents({}, { page: 1, limit: 20 }, ctx(req));
  res.render('audit/audit-dashboard', { title: 'Audit Dashboard', events });
}

async function auditEvents(req, res) {
  ensureAuditRole(req);
  const events = await auditService.searchAuditEvents(req.query || {}, {
    page: req.query.page || 1,
    limit: req.query.limit || 50
  }, ctx(req));
  res.render('audit/audit-events', { title: 'Audit Events', events });
}

async function auditEventDetail(req, res) {
  ensureAuditRole(req);
  const data = await auditService.searchAuditEvents({ eventId: req.params.eventId }, { page: 1, limit: 1 }, ctx(req));
  if (!data.items.length) {
    const error = new Error('Audit event not found');
    error.status = 404;
    throw error;
  }
  res.render('audit/audit-event-detail', { title: 'Audit Event', event: data.items[0] });
}

async function caseAuditTrail(req, res) {
  ensureAuditRole(req);
  const events = await auditService.getCaseAuditTrail(req.params.universalCaseId, {
    pagination: { page: req.query.page || 1, limit: req.query.limit || 200 }
  });
  res.render('audit/case-audit-trail', { title: 'Case Audit Trail', events });
}

async function integrityPage(req, res) {
  ensureAuditRole(req);
  res.render('audit/integrity-check', { title: 'Audit Integrity', result: null });
}

async function verifyIntegrity(req, res) {
  ensureAuditRole(req);
  const result = await auditService.verifyAuditIntegrity(req.body.filter || {}, ctx(req));
  await auditService.recordAuditEvent({
    actor: ctx(req).actor,
    action: 'audit.integrity_verified',
    resourceType: 'audit_integrity',
    resourceId: 'global',
    correlationId: ctx(req).correlationId,
    metadata: { checked: result.checked, ok: result.ok }
  }, ctx(req));
  res.render('audit/integrity-check', { title: 'Audit Integrity', result });
}

async function exportForm(req, res) {
  ensureAuditRole(req);
  res.render('audit/export-form', { title: 'Audit Export' });
}

async function exportAudit(req, res) {
  ensureAuditRole(req);
  const result = await auditService.exportAuditTrail(req.body.filter || {}, req.body.format || 'json', ctx(req));
  req.flash('success', `Audit export created (${result.exportId}).`);
  res.render('audit/export-form', { title: 'Audit Export', result });
}

module.exports = {
  auditDashboard,
  auditEvents,
  auditEventDetail,
  caseAuditTrail,
  integrityPage,
  verifyIntegrity,
  exportForm,
  exportAudit
};
