const express = require('express');
const controller = require('../controllers/document.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateBody, validateParams } = require('../middleware/validation.middleware');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { requireIdempotencyKey } = require('../middleware/idempotency.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const validators = require('../validators/document.validators');

const router = express.Router();

router.post('/documents', requireIdempotencyKey(), validateBody(validators.uploadDocumentBody), requireAnyPermission(PERMISSIONS.DOCUMENT_UPLOAD, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.uploadDocument));
router.get('/documents/:documentId', validateParams(validators.documentIdParams), requireAnyPermission(PERMISSIONS.DOCUMENT_READ, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.getDocumentById));
router.get('/cases/:caseId/documents', validateParams(validators.caseDocumentParams), requireAnyPermission(PERMISSIONS.DOCUMENT_READ, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.listCaseDocuments));
router.patch('/documents/:documentId', validateParams(validators.documentIdParams), validateBody(validators.updateDocumentBody), requireAnyPermission(PERMISSIONS.DOCUMENT_UPLOAD, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.updateDocumentMetadata));
router.post('/documents/:documentId/verify', validateParams(validators.documentIdParams), validateBody(validators.verifyDocumentBody), requireAnyPermission(PERMISSIONS.DOCUMENT_VERIFY, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.verifyDocument));
router.post('/documents/:documentId/supersede', validateParams(validators.documentIdParams), validateBody(validators.supersedeDocumentBody), requireAnyPermission(PERMISSIONS.DOCUMENT_UPLOAD, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.supersedeDocument));

module.exports = router;
