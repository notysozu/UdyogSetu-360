const auditService = require('../../../../services/audit-service/src/services/audit.service');

function ctx(req) {
  return {
    correlationId: req.context?.correlationId || null,
    userId: req.context?.actor?.id || null,
    role: req.context?.actor?.role || null,
    actor: {
      actorType: 'user',
      actorId: req.context?.actor?.id || null,
      role: req.context?.actor?.role || null,
      serviceName: 'gateway'
    }
  };
}

async function exportAudit(req, res) {
  const data = await auditService.exportAuditTrail(req.body?.filter || {}, req.body?.format || 'json', ctx(req));
  res.status(201).json({ success: true, data, error: null });
}

async function getExport(req, res) {
  const data = await auditService.getAuditExport(req.params.exportId);
  if (!data) return res.status(404).json({ success: false, data: null, error: { message: 'Export not found.' } });
  res.json({ success: true, data, error: null });
}

module.exports = { exportAudit, getExport };
