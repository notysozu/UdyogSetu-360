const { audit } = require('../services/auditLogService');
const { AUDIT_ACTIONS } = require('../../../packages/shared/src');

async function recordAccessDenied(req, _res, next) {
  if (!req.user) return next();
  await audit(AUDIT_ACTIONS.AUTH_ACCESS_DENIED, 'route', req.originalUrl, {
    user: req.user,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  }, {
    metadata: { method: req.method }
  });
  next();
}

module.exports = { recordAccessDenied };
