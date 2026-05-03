const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role.middleware');
const { requireAnyPermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const operations = require('../controllers/operationsController');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('nodal_officer', 'admin'));
router.use(requireAnyPermission(PERMISSIONS.DASHBOARD_NODAL, PERMISSIONS.CASE_VIEW_ALL));

router.get('/', asyncHandler(operations.nodalDashboard));
router.get('/cases', asyncHandler(operations.nodalDashboard));
router.get('/sla', asyncHandler(operations.nodalDashboard));
router.get('/escalations', asyncHandler(operations.nodalDashboard));

module.exports = router;
