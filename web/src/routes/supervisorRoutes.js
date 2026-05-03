const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role.middleware');
const { requireAnyPermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const operations = require('../controllers/operationsController');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('department_supervisor', 'admin', 'supervisor'));
router.use(requireAnyPermission(PERMISSIONS.DASHBOARD_DEPARTMENT, PERMISSIONS.TASK_ASSIGN));

router.get('/', asyncHandler(operations.supervisorDashboard));
router.get('/tasks', asyncHandler(operations.supervisorDashboard));
router.get('/workload', asyncHandler(operations.supervisorDashboard));

module.exports = router;
