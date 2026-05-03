const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const controller = require('../controllers/investor-case.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();
router.use(requireInvestorAuth);

router.get('/cases', asyncHandler(controller.listCases));
router.get('/cases/new', controller.showNewCaseRedirectOrForm);
router.get('/cases/:caseId', asyncHandler(controller.showCaseDetail));
router.get('/cases/:caseId/timeline', asyncHandler(controller.showCaseTimeline));
router.get('/cases/:caseId/tasks', asyncHandler(controller.showCaseTasks));
router.get('/cases/:caseId/print', asyncHandler(controller.printCase));
router.get('/cases/:caseId/acknowledgement', asyncHandler(controller.showAcknowledgement));
router.get('/cases/:caseId/responses', asyncHandler(controller.showResponses));
router.post('/cases/:caseId/responses', asyncHandler(controller.submitResponse));

module.exports = router;
