const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const admin = require('../controllers/adminController');
const operations = require('../controllers/operationsController');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', asyncHandler(admin.dashboard));
router.get('/departments', requirePermission(PERMISSIONS.ROLE_READ), asyncHandler(admin.dashboard));
router.get('/integrations', requirePermission(PERMISSIONS.INTEGRATION_READ), asyncHandler(operations.adminOperations));
router.get('/retries', requirePermission(PERMISSIONS.RETRY_READ), asyncHandler(operations.adminOperations));
router.get('/users', requirePermission(PERMISSIONS.USER_READ), asyncHandler(operations.adminUsers));
router.get('/users/:id', requirePermission(PERMISSIONS.USER_READ), asyncHandler(operations.adminUserDetail));
router.patch('/users/:id/roles', requirePermission(PERMISSIONS.ROLE_MANAGE), asyncHandler(operations.updateUserRoles));
router.patch('/users/:id/status', requirePermission(PERMISSIONS.USER_UPDATE), asyncHandler(operations.updateUserStatus));
router.get('/operations', requirePermission(PERMISSIONS.DASHBOARD_ADMIN), asyncHandler(operations.adminOperations));
router.get('/cases/:caseId/timeline', asyncHandler(admin.caseTimeline));

module.exports = router;
