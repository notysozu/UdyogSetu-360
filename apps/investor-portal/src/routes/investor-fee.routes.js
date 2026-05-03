const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const controller = require('../controllers/investor-fee.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();
router.use(requireInvestorAuth);

router.get('/fees', asyncHandler(controller.listFees));
router.get('/cases/:caseId/fees', asyncHandler(controller.listCaseFees));
router.get('/fees/:feeId', asyncHandler(controller.showFee));
router.post('/fees/:feeId/pay-placeholder', controller.payFeePlaceholder);

module.exports = router;
