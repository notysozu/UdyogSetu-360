const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const investor = require('../controllers/investorController');
const caf = require('../controllers/cafController');

const router = express.Router();
router.use(['/dashboard', '/cases', '/cases/*'], requireAuth);
router.use(['/dashboard', '/cases', '/cases/*'], requireRole('investor'));

router.get('/dashboard', requirePermission(PERMISSIONS.DASHBOARD_INVESTOR), asyncHandler(investor.dashboard));
router.get('/cases', requirePermission(PERMISSIONS.CASE_READ_OWN), asyncHandler(investor.dashboard));
router.get('/cases/new', requirePermission(PERMISSIONS.CASE_CREATE), caf.showNewForm);
router.post('/cases', requirePermission(PERMISSIONS.CASE_CREATE), asyncHandler(caf.saveDraft));
router.post('/cases/draft', requirePermission(PERMISSIONS.CASE_CREATE), asyncHandler(caf.saveDraft));
router.get('/cases/:caseId/edit', requirePermission(PERMISSIONS.CASE_READ_OWN), asyncHandler(caf.showEditDraft));
router.patch('/cases/:caseId/draft', requirePermission(PERMISSIONS.CASE_CREATE), asyncHandler(caf.updateDraft));
router.post('/cases/:caseId/validate', requirePermission(PERMISSIONS.CASE_CREATE), asyncHandler(caf.validateDraft));
router.post('/cases/:caseId/submit', requirePermission(PERMISSIONS.CASE_SUBMIT), asyncHandler(caf.submitCase));
router.get('/cases/:caseId/acknowledgement', requirePermission(PERMISSIONS.CASE_READ_OWN), asyncHandler(caf.showAcknowledgement));
router.get('/cases/:caseId/acknowledgement.pdf', requirePermission(PERMISSIONS.CASE_READ_OWN), asyncHandler(caf.showAcknowledgementPdf));
router.get('/cases/:caseId/amend', requirePermission(PERMISSIONS.CASE_CREATE), asyncHandler(caf.showAmendmentForm));
router.post('/cases/:caseId/amend', requirePermission(PERMISSIONS.CASE_CREATE), asyncHandler(caf.submitAmendment));
router.post('/cases/:caseId/resubmit', requirePermission(PERMISSIONS.CASE_SUBMIT), asyncHandler(caf.resubmitCase));
router.get('/cases/:caseId', requirePermission(PERMISSIONS.CASE_READ_OWN), asyncHandler(investor.caseDetail));
router.get('/cases/:caseId/documents', requirePermission(PERMISSIONS.DOCUMENT_READ), asyncHandler(investor.caseDetail));
router.post('/cases/:caseId/grievances', requirePermission(PERMISSIONS.GRIEVANCE_CREATE), asyncHandler(investor.raiseGrievance));
router.get('/notifications', requirePermission(PERMISSIONS.NOTIFICATION_READ), asyncHandler(investor.dashboard));

module.exports = router;
