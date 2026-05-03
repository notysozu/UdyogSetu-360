const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const controller = require('../controllers/investor-grievance.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();
router.use(requireInvestorAuth);

router.get('/grievances', asyncHandler(controller.listGrievances));
router.get('/grievances/new', asyncHandler(controller.showNewGrievanceForm));
router.post('/grievances', asyncHandler(controller.createGrievance));
router.get('/grievances/:grievanceId', asyncHandler(controller.showGrievance));
router.post('/grievances/:grievanceId/messages', asyncHandler(controller.addGrievanceMessage));

module.exports = router;
