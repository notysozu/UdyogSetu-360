const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const { requireDepartmentRoles } = require('../middleware/department-auth.middleware');
const controller = require('../controllers/supervisor.controller');

const router = express.Router();
router.use('/supervisor', requireDepartmentRoles('department_supervisor', 'admin'));

router.get('/supervisor/tasks', asyncHandler(controller.listSupervisorTasks));
router.get('/supervisor/tasks/:taskId', asyncHandler(controller.showSupervisorTask));
router.post('/supervisor/tasks/:taskId/assign', asyncHandler(controller.assignTask));
router.post('/supervisor/tasks/:taskId/reassign', asyncHandler(controller.reassignTask));
router.post('/supervisor/tasks/:taskId/escalate', asyncHandler(controller.escalateTask));
router.get('/supervisor/workload', asyncHandler(controller.showWorkload));
router.get('/supervisor/sla', asyncHandler(controller.showSlaDashboard));
router.get('/supervisor/officers', asyncHandler(controller.showOfficers));

module.exports = router;
