const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const exportController = require('../controllers/analytics-export.controller');
const rebuildController = require('../controllers/analytics-rebuild.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { requireAnyPermission, requirePermission } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const { analyticsQuery, exportBody, rebuildBody } = require('../validators/analytics.validators');

const router = express.Router();

router.get('/analytics/overview', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_ALL, PERMISSIONS.AUDIT_READ), asyncHandler(analyticsController.getOverviewApi));
router.get('/analytics/bottlenecks', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getBottlenecksApi));
router.get('/analytics/document-defects', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getDocumentDefectsApi));
router.get('/analytics/department-turnaround', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_DEPARTMENT, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getDepartmentTurnaroundApi));
router.get('/analytics/rejections', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getRejectionReasonsApi));
router.get('/analytics/query-ageing', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getQueryAgeingApi));
router.get('/analytics/officer-workload', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_OFFICER_WORKLOAD, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getOfficerWorkloadApi));
router.get('/analytics/escalations', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getEscalationsApi));
router.get('/analytics/investor-history', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getInvestorHistoryApi));
router.get('/analytics/review-pack', validateQuery(analyticsQuery), requireAnyPermission(PERMISSIONS.ANALYTICS_REVIEW_PACK, PERMISSIONS.ANALYTICS_VIEW_ALL), asyncHandler(analyticsController.getReviewPackApi));

router.post('/analytics/rebuild', validateBody(rebuildBody), requirePermission(PERMISSIONS.ANALYTICS_REBUILD), asyncHandler(rebuildController.rebuildAnalytics));
router.post('/analytics/exports', validateBody(exportBody), requireAnyPermission(PERMISSIONS.ANALYTICS_EXPORT, PERMISSIONS.AUDIT_EXPORT), asyncHandler(exportController.requestExport));
router.get('/analytics/exports/:exportId', requireAnyPermission(PERMISSIONS.ANALYTICS_EXPORT, PERMISSIONS.AUDIT_EXPORT), asyncHandler(exportController.getExport));

module.exports = router;
