const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/department-task.controller');

const router = express.Router();

router.get(['/department/tasks', '/department/tasks/inbox'], requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.listTasks));
router.get('/department/tasks/:taskId', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.showTaskDetail));
router.post('/department/tasks/:taskId/start-review', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.startReview));
router.post('/department/tasks/:taskId/checklist', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.updateChecklist));
router.post('/department/tasks/:taskId/documents/:documentId/review', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.reviewDocument));
router.post('/department/tasks/:taskId/query', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.raiseQuery));
router.post('/department/tasks/:taskId/inspection/schedule', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.scheduleInspection));
router.post('/department/tasks/:taskId/inspection/complete', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.completeInspection));
router.post('/department/tasks/:taskId/fee-demand', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.createFeeDemand));
router.post('/department/tasks/:taskId/approve', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.approveTask));
router.post('/department/tasks/:taskId/reject', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.rejectTask));
router.post('/department/tasks/:taskId/return', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.returnTask));
router.post('/department/tasks/:taskId/certificate', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.issueCertificate));
router.post('/department/tasks/:taskId/comments', requireDepartmentRoles('department_officer', 'department_supervisor', 'nodal_officer', 'admin'), asyncHandler(controller.addComment));

router.get('/api/v1/department/tasks', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.listTasks));
router.get('/api/v1/department/tasks/:taskId', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.showTaskDetail));
router.post('/api/v1/department/tasks/:taskId/start-review', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.startReview));
router.post('/api/v1/department/tasks/:taskId/checklist', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.updateChecklist));
router.post('/api/v1/department/tasks/:taskId/query', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.raiseQuery));
router.post('/api/v1/department/tasks/:taskId/inspection/schedule', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.scheduleInspection));
router.post('/api/v1/department/tasks/:taskId/inspection/complete', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.completeInspection));
router.post('/api/v1/department/tasks/:taskId/fee-demand', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.createFeeDemand));
router.post('/api/v1/department/tasks/:taskId/approve', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.approveTask));
router.post('/api/v1/department/tasks/:taskId/reject', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.rejectTask));
router.post('/api/v1/department/tasks/:taskId/certificate', requireDepartmentRoles('department_officer', 'department_supervisor', 'admin'), asyncHandler(controller.issueCertificate));
router.post('/api/v1/department/tasks/:taskId/comments', requireDepartmentRoles('department_officer', 'department_supervisor', 'nodal_officer', 'admin'), asyncHandler(controller.addComment));

module.exports = router;
