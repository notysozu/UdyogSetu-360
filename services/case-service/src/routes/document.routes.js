const express = require('express');
const controller = require('../controllers/document.controller');
const { singleDocumentUpload } = require('../documents/document-upload.middleware');

const router = express.Router();

router.post('/api/v1/documents/upload', singleDocumentUpload, controller.upload);
router.post('/api/v1/cases/:caseId/documents/upload', singleDocumentUpload, controller.uploadForCase);
router.post('/api/v1/documents/signed-upload-url', controller.signedUploadUrl);
router.post('/api/v1/documents/:documentId/confirm-upload', controller.confirmUpload);
router.get('/api/v1/documents/:documentId', controller.metadata);
router.patch('/api/v1/documents/:documentId/metadata', controller.updateMetadata);
router.get('/api/v1/cases/:caseId/documents', controller.listByCase);
router.get('/api/v1/tasks/:taskId/documents', controller.listByTask);
router.get('/api/v1/documents/:documentId/signed-download-url', controller.signedDownloadUrl);
router.get('/api/v1/documents/:documentId/download', controller.download);
router.get('/api/v1/documents/:documentId/preview', controller.preview);
router.post('/api/v1/documents/:documentId/new-version', singleDocumentUpload, controller.newVersion);
router.get('/api/v1/documents/:documentId/versions', controller.versions);
router.post('/api/v1/documents/:documentId/tags', controller.addTags);
router.delete('/api/v1/documents/:documentId/tags/:tag', controller.removeTag);
router.post('/api/v1/documents/:documentId/verify', controller.verify);
router.post('/api/v1/documents/:documentId/reject', controller.reject);
router.post('/api/v1/documents/:documentId/supersede', controller.supersede);
router.post('/api/v1/documents/:documentId/scan', controller.scan);
router.post('/api/v1/documents/scanning/callback', controller.scanCallback);
router.put(
  '/api/v1/documents/local-upload',
  express.raw({ type: '*/*', limit: `${Number(process.env.DOCUMENT_MAX_FILE_SIZE_MB || 25)}mb` }),
  controller.localUpload
);
router.get('/api/v1/documents/local-download', controller.localDownload);

module.exports = router;
