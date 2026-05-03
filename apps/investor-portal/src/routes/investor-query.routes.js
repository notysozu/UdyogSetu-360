const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const controller = require('../controllers/investor-query.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();
router.use(requireInvestorAuth);

router.get('/queries', asyncHandler(controller.listQueries));
router.get('/cases/:caseId/queries', asyncHandler(controller.listCaseQueries));
router.get('/queries/:queryId', asyncHandler(controller.showQuery));
router.post('/queries/:queryId/respond', asyncHandler(controller.respondToQuery));

module.exports = router;
