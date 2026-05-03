const express = require('express');
const controller = require('../controllers/grievance.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation.middleware');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { requireIdempotencyKey } = require('../middleware/idempotency.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const validators = require('../validators/grievance.validators');

const router = express.Router();

router.post('/grievances', requireIdempotencyKey(), validateBody(validators.createGrievanceBody), requireAnyPermission(PERMISSIONS.GRIEVANCE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.createGrievance));
router.get('/grievances', validateQuery(validators.listGrievancesQuery), requireAnyPermission(PERMISSIONS.GRIEVANCE_READ, PERMISSIONS.CASE_VIEW_ALL), asyncHandler(controller.listGrievances));
router.get('/grievances/:grievanceId', validateParams(validators.grievanceIdParams), requireAnyPermission(PERMISSIONS.GRIEVANCE_READ, PERMISSIONS.CASE_VIEW_ALL), asyncHandler(controller.getGrievanceById));
router.post('/grievances/:grievanceId/messages', validateParams(validators.grievanceIdParams), validateBody(validators.grievanceMessageBody), requireAnyPermission(PERMISSIONS.GRIEVANCE_RESPOND, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.addGrievanceMessage));
router.patch('/grievances/:grievanceId/status', validateParams(validators.grievanceIdParams), validateBody(validators.grievanceStatusBody), requireAnyPermission(PERMISSIONS.GRIEVANCE_RESOLVE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.updateGrievanceStatus));

module.exports = router;
