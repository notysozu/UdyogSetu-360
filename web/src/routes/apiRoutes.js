const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const api = require('../controllers/apiController');
const caf = require('../controllers/cafController');
const { requireApiAuth } = require('../middleware/auth');
const { requireAnyPermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');

const router = express.Router();

router.get('/health', api.health);
router.use(requireApiAuth);
router.get('/cases', requireAnyPermission(PERMISSIONS.CASE_READ, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_VIEW_ALL), asyncHandler(api.listCasesApi));
router.post('/cases', requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(api.createCaseApi));
router.post('/cases/draft', requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(caf.saveDraft));
router.patch('/cases/:caseId/draft', requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(caf.updateDraft));
router.post('/cases/:caseId/validate', requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(caf.validateDraft));
router.post('/cases/:caseId/submit', requireAnyPermission(PERMISSIONS.CASE_SUBMIT, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(caf.submitCase));
router.get('/cases/:caseId/acknowledgement', requireAnyPermission(PERMISSIONS.CASE_READ, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_VIEW_ALL), asyncHandler(caf.showAcknowledgement));
router.post('/cases/:caseId/amend', requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(caf.submitAmendment));
router.post('/cases/:caseId/resubmit', requireAnyPermission(PERMISSIONS.CASE_SUBMIT, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(caf.resubmitCase));
router.post('/cases/duplicate-check', requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(caf.duplicateCheck));
router.get('/cases/:caseId/events', requireAnyPermission(PERMISSIONS.AUDIT_READ, PERMISSIONS.CASE_READ, PERMISSIONS.CASE_READ_OWN), asyncHandler(api.eventsApi));
router.post('/ai/validate', requireAnyPermission(PERMISSIONS.CASE_CREATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(api.validateApi));
router.post('/ai/predict-delay', requireAnyPermission(PERMISSIONS.CASE_READ, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(api.delayRiskApi));

module.exports = router;
