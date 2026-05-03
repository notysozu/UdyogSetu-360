const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/admin/analytics', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showOverview));
router.get('/admin/analytics/bottlenecks', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showBottlenecks));
router.get('/admin/analytics/document-defects', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showDocumentDefects));
router.get('/admin/analytics/department-turnaround', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showDepartmentTurnaround));
router.get('/admin/analytics/rejections', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showRejectionReasons));
router.get('/admin/analytics/query-ageing', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showQueryAgeing));
router.get('/admin/analytics/officer-workload', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showOfficerWorkload));
router.get('/admin/analytics/escalations', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showEscalations));
router.get('/admin/analytics/investor-history', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showInvestorHistory));
router.get('/admin/analytics/review-pack', requireDepartmentRoles('admin', 'department_supervisor', 'nodal_officer', 'auditor'), asyncHandler(controller.showReviewPack));
router.get('/admin/analytics/exports', requireDepartmentRoles('admin', 'department_supervisor', 'auditor'), asyncHandler(controller.showExportList));
router.post('/admin/analytics/exports', requireDepartmentRoles('admin', 'department_supervisor', 'auditor'), asyncHandler(controller.requestExport));

router.get('/supervisor/analytics', requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.showOverview));
router.get('/supervisor/analytics/officer-workload', requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.showOfficerWorkload));
router.get('/supervisor/analytics/department-turnaround', requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.showDepartmentTurnaround));
router.get('/supervisor/analytics/query-ageing', requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.showQueryAgeing));

router.get('/nodal/analytics', requireDepartmentRoles('nodal_officer', 'admin'), asyncHandler(controller.showOverview));
router.get('/nodal/analytics/bottlenecks', requireDepartmentRoles('nodal_officer', 'admin'), asyncHandler(controller.showBottlenecks));
router.get('/nodal/analytics/escalations', requireDepartmentRoles('nodal_officer', 'admin'), asyncHandler(controller.showEscalations));
router.get('/nodal/analytics/review-pack', requireDepartmentRoles('nodal_officer', 'admin'), asyncHandler(controller.showReviewPack));

module.exports = router;
