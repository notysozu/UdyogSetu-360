const express = require('express');
const controller = require('../controllers/certificate.controller');
const { singleDocumentUpload } = require('../documents/document-upload.middleware');

const router = express.Router();

router.post('/api/v1/certificates', singleDocumentUpload, controller.create);
router.get('/api/v1/certificates/:certificateNumber', controller.getByNumber);
router.post('/api/v1/certificates/:certificateNumber/revoke', controller.revoke);
router.get('/verify/certificate/:verificationToken', controller.verifyPublic);

module.exports = router;
