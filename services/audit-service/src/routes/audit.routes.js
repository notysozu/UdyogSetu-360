const express = require('express');
const controller = require('../controllers/audit.controller');

const router = express.Router();

router.post('/audit/events', controller.createEvent);
router.get('/audit/events', controller.listEvents);
router.get('/audit/events/:eventId', controller.getEvent);
router.get('/audit/case/:universalCaseId', controller.getCaseEvents);
router.post('/audit/integrity/verify', controller.verifyIntegrity);
router.post('/audit/export', controller.exportAudit);
router.get('/audit/export/:exportId', controller.getExport);

router.post('/api/v1/audit/events', controller.createEvent);
router.get('/api/v1/audit/events', controller.listEvents);
router.get('/api/v1/audit/events/:eventId', controller.getEvent);
router.get('/api/v1/audit/case/:universalCaseId', controller.getCaseEvents);
router.post('/api/v1/audit/integrity/verify', controller.verifyIntegrity);
router.post('/api/v1/audit/export', controller.exportAudit);
router.get('/api/v1/audit/export/:exportId', controller.getExport);

module.exports = router;
