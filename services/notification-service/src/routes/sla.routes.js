const express = require('express');
const controller = require('../controllers/sla.controller');

const router = express.Router();

router.get('/api/v1/sla/approval-ageing', controller.approvalAgeing);
router.get('/api/v1/sla/grievance-ageing', controller.grievanceAgeing);
router.post('/api/v1/sla/evaluate', controller.evaluate);
router.post('/api/v1/sla/timers/:timerId/pause', controller.pause);
router.post('/api/v1/sla/timers/:timerId/resume', controller.resume);
router.post('/api/v1/sla/timers/:timerId/complete', controller.complete);
router.post('/api/v1/sla/timers/:timerId/escalate', controller.escalate);

module.exports = router;
