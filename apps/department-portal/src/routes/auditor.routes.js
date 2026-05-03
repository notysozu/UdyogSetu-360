const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/auditor.controller');

const router = express.Router();
router.use('/audit', requireDepartmentRoles('auditor', 'admin'));

router.get('/audit/tasks', asyncHandler(controller.listAuditTasks));
router.get('/audit/tasks/:taskId', asyncHandler(controller.showAuditTask));
router.get('/audit/cases/:caseId', asyncHandler(controller.showAuditCase));
router.get('/audit/events', asyncHandler(controller.listAuditEvents));
router.get('/audit/case/:caseId/export', asyncHandler(controller.exportCaseAudit));

module.exports = router;
