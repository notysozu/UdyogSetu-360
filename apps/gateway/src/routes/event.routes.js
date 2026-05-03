const express = require('express');
const controller = require('../controllers/event.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateBody, validateParams } = require('../middleware/validation.middleware');
const { webhookVerificationMiddleware } = require('../middleware/webhook-verification.middleware');
const { requireIdempotencyKey } = require('../middleware/idempotency.middleware');
const {
  allowServiceAuthOrVerifiedWebhook,
  requireAnyPermission
} = require('../middleware/auth.middleware');
const { createRateLimiters } = require('../middleware/rate-limit.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const validators = require('../validators/event.validators');

const router = express.Router();
const rateLimiters = createRateLimiters();

router.post(
  '/events/ingest',
  rateLimiters.webhookLimiter,
  webhookVerificationMiddleware(),
  allowServiceAuthOrVerifiedWebhook,
  requireIdempotencyKey(),
  validateBody(validators.ingestEventBody),
  requireAnyPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL),
  asyncHandler(controller.ingestEvent)
);
router.get('/events', asyncHandler(controller.listEvents));
router.get('/events/case/:universalCaseId', asyncHandler(controller.listCaseEventsByUniversalCaseId));
router.get('/events/:eventId', validateParams(validators.eventIdParams), asyncHandler(controller.getEventById));
router.get('/cases/:caseId/events', validateParams(validators.caseEventsParams), asyncHandler(controller.listCaseEvents));
router.post(
  '/events/replay',
  validateBody(validators.replayEventsBody),
  requireAnyPermission(PERMISSIONS.AUDIT_READ, PERMISSIONS.RETRY_MANAGE, PERMISSIONS.SYSTEM_INTERNAL_CALL),
  asyncHandler(controller.replayEvents)
);
router.post('/integrations/:departmentCode/callback', rateLimiters.webhookLimiter, webhookVerificationMiddleware(), validateParams(validators.integrationCallbackParams), asyncHandler(controller.receiveDepartmentCallback));
router.get('/integrations/:departmentCode/health', validateParams(validators.integrationCallbackParams), asyncHandler(controller.getDepartmentIntegrationHealth));
router.post('/webhooks/n8n/:workflowCode', rateLimiters.webhookLimiter, webhookVerificationMiddleware(), validateParams(validators.n8nWebhookParams), asyncHandler(controller.receiveN8nWebhook));
router.post('/webhooks/departments/:departmentCode', rateLimiters.webhookLimiter, webhookVerificationMiddleware(), validateParams(validators.integrationCallbackParams), asyncHandler(controller.receiveDepartmentWebhook));

module.exports = router;
