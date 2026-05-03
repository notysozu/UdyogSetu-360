const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { singleDocumentUpload } = require('../../../../services/case-service/src/documents/document-upload.middleware');
const controller = require('../controllers/investor-document.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();
router.use(requireInvestorAuth);

router.get('/documents', asyncHandler(controller.showDocumentCentre));
router.get('/cases/:caseId/documents', asyncHandler(controller.listCaseDocuments));
router.get('/documents/:documentId', asyncHandler(controller.showDocumentDetail));
router.get('/documents/:documentId/download', asyncHandler(controller.downloadDocument));
router.post('/cases/:caseId/documents/upload', singleDocumentUpload, asyncHandler(controller.uploadCaseDocument));
router.post('/documents/:documentId/new-version', singleDocumentUpload, asyncHandler(controller.createNewDocumentVersion));

module.exports = router;
