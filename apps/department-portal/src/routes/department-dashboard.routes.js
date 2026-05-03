const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/department-dashboard.controller');

const router = express.Router();
router.get(['/department', '/department/dashboard'], requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.showOfficerDashboard));
router.get(['/supervisor', '/supervisor/dashboard'], requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.showSupervisorDashboard));
router.get(['/nodal', '/nodal/dashboard'], requireDepartmentRoles('nodal_officer', 'admin'), asyncHandler(controller.showNodalDashboard));
router.get(['/audit', '/audit/dashboard'], requireDepartmentRoles('auditor', 'admin'), asyncHandler(controller.showAuditorDashboard));

module.exports = router;
