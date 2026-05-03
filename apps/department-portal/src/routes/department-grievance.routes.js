const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/department-grievance.controller');

const router = express.Router();

router.get('/department/grievances', requireDepartmentRoles('department_officer', 'department_supervisor', 'nodal_officer', 'auditor', 'admin'), asyncHandler(controller.list));
router.get('/department/grievances/:grievanceId', requireDepartmentRoles('department_officer', 'department_supervisor', 'nodal_officer', 'auditor', 'admin'), asyncHandler(controller.detail));
router.post('/department/grievances/:grievanceId/acknowledge', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.acknowledge));
router.post('/department/grievances/:grievanceId/assign', requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.assign));
router.post('/department/grievances/:grievanceId/internal-comments', requireDepartmentRoles('department_officer', 'department_supervisor', 'nodal_officer', 'admin'), asyncHandler(controller.internalComment));
router.post('/department/grievances/:grievanceId/external-replies', requireDepartmentRoles('department_officer', 'department_supervisor', 'nodal_officer', 'admin'), asyncHandler(controller.externalReply));
router.post('/department/grievances/:grievanceId/resolve', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.resolve));
router.post('/department/grievances/:grievanceId/close', requireDepartmentRoles('department_supervisor', 'admin'), asyncHandler(controller.close));
router.post('/department/grievances/:grievanceId/escalate', requireDepartmentRoles('department_supervisor', 'nodal_officer', 'admin'), asyncHandler(controller.escalate));

module.exports = router;
