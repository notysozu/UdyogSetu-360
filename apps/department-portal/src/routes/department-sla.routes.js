const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/department-sla.controller');

const router = express.Router();

router.get('/department/sla', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.showDepartmentSla));
router.get('/supervisor/sla', requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.showSupervisorSla));
router.get('/nodal/sla', requireDepartmentRoles('nodal_officer', 'admin'), asyncHandler(controller.showNodalSla));
router.get('/admin/sla', requireDepartmentRoles('admin'), asyncHandler(controller.showAdminSla));
router.get('/department/grievances/ageing', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.showDepartmentGrievanceAgeing));
router.get('/admin/grievances/ageing', requireDepartmentRoles('admin'), asyncHandler(controller.showAdminGrievanceAgeing));

module.exports = router;
