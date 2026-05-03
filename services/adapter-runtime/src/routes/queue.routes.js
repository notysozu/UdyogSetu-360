const express = require('express');
const controller = require('../controllers/queue.controller');
const { requireServiceAuth, requireAnyPermission } = require('../middleware/queue-auth.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');

const router = express.Router();

router.use(requireServiceAuth);

router.get('/api/v1/queues/health', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.AUDIT_READ, PERMISSIONS.INTEGRATION_READ), controller.health);
router.get('/api/v1/queues/stats', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.AUDIT_READ, PERMISSIONS.INTEGRATION_READ), controller.stats);
router.get('/api/v1/queues/jobs', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.AUDIT_READ, PERMISSIONS.INTEGRATION_READ), controller.jobs);
router.get('/api/v1/queues/jobs/:messageId', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.AUDIT_READ, PERMISSIONS.INTEGRATION_READ), controller.jobById);
router.get('/api/v1/queues/dead-letter', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.AUDIT_READ, PERMISSIONS.RETRY_READ), controller.deadLetter);
router.post('/api/v1/queues/dead-letter/:messageId/requeue', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.RETRY_MANAGE), controller.requeueDeadLetter);
router.post('/api/v1/queues/dead-letter/requeue-batch', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.RETRY_MANAGE), controller.requeueDeadLetterBatch);
router.post('/api/v1/queues/jobs/:messageId/cancel', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.RETRY_MANAGE), controller.cancelJob);
router.post('/api/v1/queues/publish-test-delivery', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE), controller.publishTestDelivery);
router.post('/api/v1/queues/publish-test-callback', requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE), controller.publishTestCallback);

module.exports = router;
