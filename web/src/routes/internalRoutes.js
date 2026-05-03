const express = require('express');
const { requireInternalCall } = require('../middleware/service-auth.middleware');
const operations = require('../controllers/operationsController');
const { audit } = require('../services/auditLogService');
const { AUDIT_ACTIONS } = require('../../../packages/shared/src');

const router = express.Router();

router.use(requireInternalCall);
router.use((req, _res, next) => {
  audit(AUDIT_ACTIONS.AUTH_SERVICE_AUTHENTICATED, 'internal_route', req.originalUrl, {
    user: req.serviceUser,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  }, {
    metadata: { serviceName: req.serviceUser?.serviceName || 'unknown' }
  }).catch(() => {});
  next();
});
router.get('/health', operations.internalHealth);

module.exports = router;
