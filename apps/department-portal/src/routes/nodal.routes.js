const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/nodal.controller');

const router = express.Router();
router.use('/nodal', requireDepartmentRoles('nodal_officer', 'admin'));

router.get('/nodal/cases', asyncHandler(controller.listCases));
router.get('/nodal/cases/:caseId', asyncHandler(controller.showCaseDetail));
router.get('/nodal/sla', asyncHandler(controller.showSlaDashboard));
router.get('/nodal/escalations', asyncHandler(controller.showEscalations));
router.post('/nodal/cases/:caseId/escalate', asyncHandler(controller.escalateCase));
router.post('/nodal/cases/:caseId/comment', asyncHandler(controller.addCaseComment));
router.post('/nodal/tasks/:taskId/request-action', asyncHandler(controller.requestDepartmentAction));

module.exports = router;
