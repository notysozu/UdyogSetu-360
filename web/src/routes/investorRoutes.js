const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/auth');
const investor = require('../controllers/investorController');

const router = express.Router();
router.use(requireRole('investor'));

router.get('/dashboard', asyncHandler(investor.dashboard));
router.get('/cases/new', investor.newCaseForm);
router.post('/cases', asyncHandler(investor.createCaseFromForm));
router.get('/cases/:caseId', asyncHandler(investor.caseDetail));
router.post('/cases/:caseId/grievances', asyncHandler(investor.raiseGrievance));

module.exports = router;
