const express = require('express');
const controller = require('../controllers/grievance.controller');

const router = express.Router();

router.post('/api/v1/grievances', controller.create);
router.get('/api/v1/grievances', controller.list);
router.get('/api/v1/grievances/:grievanceId', controller.get);
router.post('/api/v1/grievances/:grievanceId/messages', controller.addMessage);
router.post('/api/v1/grievances/:grievanceId/internal-comments', controller.addInternalComment);
router.post('/api/v1/grievances/:grievanceId/external-replies', controller.addExternalReply);
router.patch('/api/v1/grievances/:grievanceId/status', controller.patchStatus);
router.post('/api/v1/grievances/:grievanceId/acknowledge', controller.acknowledge);
router.post('/api/v1/grievances/:grievanceId/assign', controller.assign);
router.post('/api/v1/grievances/:grievanceId/resolve', controller.resolve);
router.post('/api/v1/grievances/:grievanceId/close', controller.close);
router.post('/api/v1/grievances/:grievanceId/reopen', controller.reopen);
router.post('/api/v1/grievances/:grievanceId/escalate', controller.escalate);

module.exports = router;
