const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const grievance = require('../controllers/grievanceController');

const router = express.Router();

router.get('/grievances/new', requireAuth, requirePermission(PERMISSIONS.GRIEVANCE_CREATE), asyncHandler(grievance.newGrievanceForm));
router.post('/grievances', requireAuth, requirePermission(PERMISSIONS.GRIEVANCE_CREATE), asyncHandler(grievance.createGrievance));

module.exports = router;
