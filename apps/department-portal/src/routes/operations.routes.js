const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/operations.controller');
const auditViewerController = require('../controllers/audit-viewer.controller');

const router = express.Router();
router.use('/admin', requireDepartmentRoles('admin', 'auditor'));

router.get('/admin/operations', asyncHandler(controller.dashboard));
router.get('/admin/operations/health', asyncHandler(controller.health));
router.get('/admin/operations/queues', asyncHandler(controller.queues));
router.get('/admin/operations/adapters', asyncHandler(controller.adapters));
router.get('/admin/operations/consumers', asyncHandler(controller.consumers));
router.get('/admin/operations/stuck-cases', asyncHandler(controller.stuckCases));
router.get('/admin/operations/stuck-cases/:findingId', asyncHandler(controller.stuckCaseDetail));
router.post('/admin/operations/stuck-cases/:findingId/acknowledge', requireDepartmentRoles('admin'), asyncHandler(controller.acknowledgeStuckCase));
router.post('/admin/operations/stuck-cases/:findingId/resolve', requireDepartmentRoles('admin'), asyncHandler(controller.resolveStuckCase));
router.get('/admin/operations/replay', asyncHandler(controller.replayList));
router.get('/admin/operations/replay/new', asyncHandler(controller.replayForm));
router.get('/admin/operations/replay/:replayId', asyncHandler(controller.replayDetail));
router.post('/admin/operations/replay', requireDepartmentRoles('admin'), asyncHandler(controller.replayStart));
router.get('/admin/operations/cases/:caseId/trace', asyncHandler(controller.caseTrace));
router.get('/admin/operations/correlation/:correlationId', asyncHandler(controller.correlationTrace));

router.get('/admin/audit', asyncHandler(auditViewerController.auditDashboard));
router.get('/admin/audit/events', asyncHandler(auditViewerController.auditEvents));
router.get('/admin/audit/events/:eventId', asyncHandler(auditViewerController.auditEventDetail));
router.get('/admin/audit/case/:universalCaseId', asyncHandler(auditViewerController.caseAuditTrail));
router.get('/admin/audit/integrity', asyncHandler(auditViewerController.integrityPage));
router.post('/admin/audit/integrity/verify', asyncHandler(auditViewerController.verifyIntegrity));
router.get('/admin/audit/export', asyncHandler(auditViewerController.exportForm));
router.post('/admin/audit/export', asyncHandler(auditViewerController.exportAudit));

module.exports = router;
