const express = require('express');
const controller = require('../controllers/case.controller');

const router = express.Router();

router.post('/cases', controller.createCase);
router.get('/cases', controller.listCases);
router.get('/cases/:id', controller.getCase);
router.patch('/cases/:id', controller.updateCase);
router.post('/cases/:id/submit', controller.submitCaseAction);
router.get('/cases/:id/timeline', controller.getTimeline);
router.post('/cases/:id/documents', controller.uploadDocument);
router.post('/cases/:id/grievances', controller.raiseGrievance);

module.exports = router;
