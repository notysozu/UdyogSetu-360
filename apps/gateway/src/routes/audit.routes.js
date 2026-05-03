const express = require('express');
const controller = require('../controllers/audit-viewer.controller');
const exportController = require('../controllers/audit-export.controller');
const { asyncHandler } = require('../../../../packages/shared/src/utils/asyncHandler');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src/constants/permission.constants');
const { validateBody } = require('../middleware/validation.middleware');
const exportValidators = require('../validators/export.validators');

const router = express.Router();
router.use('/audit', requireAnyPermission(PERMISSIONS.AUDIT_READ, PERMISSIONS.SYSTEM_INTERNAL_CALL));

router.get('/audit/events', asyncHandler(controller.listEvents));
router.get('/audit/events/:eventId', asyncHandler(controller.getEvent));
router.get('/audit/case/:universalCaseId', asyncHandler(controller.getCase));
router.post('/audit/integrity/verify', requireAnyPermission(PERMISSIONS.AUDIT_INTEGRITY_VERIFY, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.verifyIntegrity));
router.post('/audit/export', requireAnyPermission(PERMISSIONS.AUDIT_EXPORT, PERMISSIONS.SYSTEM_INTERNAL_CALL), validateBody(exportValidators.exportBody), asyncHandler(exportController.exportAudit));
router.get('/audit/export/:exportId', requireAnyPermission(PERMISSIONS.AUDIT_EXPORT, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(exportController.getExport));

module.exports = router;
