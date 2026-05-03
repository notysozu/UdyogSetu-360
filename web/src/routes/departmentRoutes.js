const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role.middleware');
const { requireAnyPermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const department = require('../controllers/departmentController');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole('department_officer', 'nodal_officer', 'department_supervisor', 'supervisor', 'admin'));
router.use(requireAnyPermission(PERMISSIONS.DASHBOARD_DEPARTMENT, PERMISSIONS.TASK_READ_DEPARTMENT, PERMISSIONS.CASE_VIEW_ALL));

router.get('/', asyncHandler(department.queue));
router.get('/queue', asyncHandler(department.queue));
router.get('/tasks', asyncHandler(department.queue));
router.get('/tasks/:id', asyncHandler(department.queue));
router.get('/inspections', asyncHandler(department.queue));
router.post('/cases/:caseId/actions', requireAnyPermission(PERMISSIONS.TASK_UPDATE, PERMISSIONS.TASK_RAISE_QUERY, PERMISSIONS.TASK_APPROVE, PERMISSIONS.TASK_REJECT), asyncHandler(department.updateTask));

module.exports = router;
