const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const controller = require('../controllers/documentController');

const router = express.Router();

router.get('/cases/:caseId/documents/manage', requireAuth, requirePermission(PERMISSIONS.DOCUMENT_READ), asyncHandler(controller.list));
router.get('/cases/:caseId/documents/upload', requireAuth, requirePermission(PERMISSIONS.DOCUMENT_UPLOAD), asyncHandler(controller.uploadForm));
router.get('/documents/:documentId', requireAuth, requirePermission(PERMISSIONS.DOCUMENT_READ), asyncHandler(controller.detail));
router.get('/documents/:documentId/versions', requireAuth, requirePermission(PERMISSIONS.DOCUMENT_READ), asyncHandler(controller.versions));
router.get('/certificates/:certificateNumber/detail', asyncHandler(controller.certificateDetail));
router.get('/digilocker/consent', requireAuth, requirePermission(PERMISSIONS.DIGILOCKER_CONSENT), asyncHandler(controller.digilockerConsent));
router.get('/digilocker/documents', requireAuth, requirePermission(PERMISSIONS.DIGILOCKER_RETRIEVE), asyncHandler(controller.digilockerDocuments));

module.exports = router;
