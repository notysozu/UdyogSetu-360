const express = require('express');
const controller = require('../controllers/case.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation.middleware');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { requireIdempotencyKey } = require('../middleware/idempotency.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const validators = require('../validators/case.validators');

const router = express.Router();

router.post(
  '/cases',
  requireIdempotencyKey(),
  validateBody(validators.createCaseBody),
  requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL),
  asyncHandler(controller.createCase)
);
router.get(
  '/cases',
  validateQuery(validators.listCasesQuery),
  requireAnyPermission(PERMISSIONS.CASE_READ, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_VIEW_ALL),
  asyncHandler(controller.listCases)
);
router.get(
  '/cases/:caseId',
  validateParams(validators.caseIdParams),
  requireAnyPermission(PERMISSIONS.CASE_READ, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_VIEW_ALL),
  asyncHandler(controller.getCaseById)
);
router.patch(
  '/cases/:caseId',
  validateParams(validators.caseIdParams),
  validateBody(validators.updateCaseBody),
  requireAnyPermission(PERMISSIONS.CASE_UPDATE, PERMISSIONS.SYSTEM_INTERNAL_CALL),
  asyncHandler(controller.updateCase)
);
router.post(
  '/cases/:caseId/submit',
  requireIdempotencyKey(),
  validateParams(validators.caseIdParams),
  requireAnyPermission(PERMISSIONS.CASE_SUBMIT, PERMISSIONS.SYSTEM_INTERNAL_CALL),
  asyncHandler(controller.submitCase)
);
router.post(
  '/cases/:caseId/amend',
  validateParams(validators.caseIdParams),
  validateBody(validators.amendCaseBody),
  requireAnyPermission(PERMISSIONS.CASE_UPDATE, PERMISSIONS.SYSTEM_INTERNAL_CALL),
  asyncHandler(controller.amendCase)
);
router.get('/cases/:caseId/timeline', validateParams(validators.caseIdParams), asyncHandler(controller.getCaseTimeline));
router.get('/cases/:caseId/tasks', validateParams(validators.caseIdParams), asyncHandler(controller.getCaseTasks));
router.get('/cases/:caseId/documents', validateParams(validators.caseIdParams), asyncHandler(controller.getCaseDocuments));
router.get('/cases/:caseId/grievances', validateParams(validators.caseIdParams), asyncHandler(controller.getCaseGrievances));

module.exports = router;
