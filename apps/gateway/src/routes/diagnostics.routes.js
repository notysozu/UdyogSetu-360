const express = require('express');
const controller = require('../controllers/diagnostics.controller');
const { asyncHandler } = require('../../../../packages/shared/src/utils/asyncHandler');
const { validateParams } = require('../middleware/validation.middleware');
const validators = require('../validators/diagnostics.validators');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src/constants/permission.constants');

const router = express.Router();

router.use('/diagnostics', requireAnyPermission(PERMISSIONS.DIAGNOSTICS_VIEW, PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.AUDIT_READ));
router.get('/diagnostics/health', asyncHandler(controller.health));
router.get('/diagnostics/readiness', asyncHandler(controller.readiness));
router.get('/diagnostics/config', asyncHandler(controller.config));
router.get('/diagnostics/dependencies', asyncHandler(controller.dependencies));
router.get('/diagnostics/queues', asyncHandler(controller.queues));
router.get('/diagnostics/kafka', asyncHandler(controller.kafka));
router.get('/diagnostics/rabbitmq', asyncHandler(controller.rabbitmq));
router.get('/diagnostics/adapters', asyncHandler(controller.adapters));
router.get('/diagnostics/consumers', asyncHandler(controller.consumers));
router.get('/diagnostics/jobs', asyncHandler(controller.jobs));
router.get('/diagnostics/stuck-cases', asyncHandler(controller.stuckCases));
router.get('/diagnostics/cases/:caseId/trace', validateParams(validators.caseParams), asyncHandler(controller.caseTrace));
router.get('/diagnostics/correlation/:correlationId', validateParams(validators.correlationParams), asyncHandler(controller.correlationTrace));
router.post('/diagnostics/run-stuck-case-scan', requireAnyPermission(PERMISSIONS.DIAGNOSTICS_RUN, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.runStuckCaseScan));

module.exports = router;
