const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateQuery } = require('../middleware/validation.middleware');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { createRateLimiters } = require('../middleware/rate-limit.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const { dashboardQuery } = require('../validators/dashboard.validators');

const router = express.Router();
const rateLimiters = createRateLimiters();

router.get('/dashboard/investor', rateLimiters.dashboardLimiter, validateQuery(dashboardQuery), requireAnyPermission(PERMISSIONS.DASHBOARD_INVESTOR), asyncHandler(controller.getInvestorDashboard));
router.get('/dashboard/department', rateLimiters.dashboardLimiter, validateQuery(dashboardQuery), requireAnyPermission(PERMISSIONS.DASHBOARD_DEPARTMENT), asyncHandler(controller.getDepartmentDashboard));
router.get('/dashboard/nodal', rateLimiters.dashboardLimiter, validateQuery(dashboardQuery), requireAnyPermission(PERMISSIONS.DASHBOARD_NODAL), asyncHandler(controller.getNodalDashboard));
router.get('/dashboard/admin', rateLimiters.dashboardLimiter, validateQuery(dashboardQuery), requireAnyPermission(PERMISSIONS.DASHBOARD_ADMIN), asyncHandler(controller.getAdminDashboard));
router.get('/dashboard/audit', rateLimiters.dashboardLimiter, validateQuery(dashboardQuery), requireAnyPermission(PERMISSIONS.DASHBOARD_AUDIT), asyncHandler(controller.getAuditDashboard));
router.get('/dashboard/public-metrics', rateLimiters.dashboardLimiter, validateQuery(dashboardQuery), asyncHandler(controller.getPublicMetrics));

module.exports = router;
