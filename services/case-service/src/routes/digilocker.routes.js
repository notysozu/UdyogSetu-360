const express = require('express');
const controller = require('../controllers/digilocker.controller');

const router = express.Router();

router.get('/digilocker/connect', controller.connect);
router.post('/api/v1/digilocker/consents', controller.createConsent);
router.get('/digilocker/callback', controller.callback);
router.get('/api/v1/digilocker/consents/:consentId', controller.getConsent);
router.post('/api/v1/digilocker/consents/:consentId/revoke', controller.revokeConsent);
router.get('/api/v1/digilocker/documents', controller.listDocuments);
router.post('/api/v1/digilocker/documents/retrieve', controller.retrieveDocument);
router.post('/api/v1/digilocker/documents/verify', controller.verifyDocument);
router.post('/api/v1/digilocker/documents/import', controller.importDocument);
router.post('/api/v1/digilocker/webhook', controller.webhook);

module.exports = router;
