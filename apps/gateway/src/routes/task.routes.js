const express = require('express');
const controller = require('../controllers/task.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation.middleware');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { requireIdempotencyKey } = require('../middleware/idempotency.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const validators = require('../validators/task.validators');

const router = express.Router();

router.get('/tasks', validateQuery(validators.listTasksQuery), requireAnyPermission(PERMISSIONS.TASK_READ, PERMISSIONS.TASK_READ_DEPARTMENT), asyncHandler(controller.listTasks));
router.get('/tasks/:taskId', validateParams(validators.taskIdParams), requireAnyPermission(PERMISSIONS.TASK_READ, PERMISSIONS.TASK_READ_DEPARTMENT), asyncHandler(controller.getTaskById));
router.patch('/tasks/:taskId', validateParams(validators.taskIdParams), validateBody(validators.updateTaskBody), requireAnyPermission(PERMISSIONS.TASK_UPDATE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.updateTask));
router.post('/tasks/:taskId/actions/assign', requireIdempotencyKey(), validateParams(validators.taskIdParams), validateBody(validators.assignTaskBody), requireAnyPermission(PERMISSIONS.TASK_ASSIGN, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.assignTask));
router.post('/tasks/:taskId/actions/raise-query', requireIdempotencyKey(), validateParams(validators.taskIdParams), validateBody(validators.raiseQueryBody), requireAnyPermission(PERMISSIONS.TASK_RAISE_QUERY, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.raiseQuery));
router.post('/tasks/:taskId/actions/respond-query', requireIdempotencyKey(), validateParams(validators.taskIdParams), validateBody(validators.respondQueryBody), requireAnyPermission(PERMISSIONS.TASK_RESPOND_QUERY, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.respondQuery));
router.post('/tasks/:taskId/actions/schedule-inspection', requireIdempotencyKey(), validateParams(validators.taskIdParams), validateBody(validators.scheduleInspectionBody), requireAnyPermission(PERMISSIONS.INSPECTION_SCHEDULE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.scheduleInspection));
router.post('/tasks/:taskId/actions/approve', requireIdempotencyKey(), validateParams(validators.taskIdParams), validateBody(validators.decisionBody), requireAnyPermission(PERMISSIONS.TASK_APPROVE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.approveTask));
router.post('/tasks/:taskId/actions/reject', requireIdempotencyKey(), validateParams(validators.taskIdParams), validateBody(validators.decisionBody), requireAnyPermission(PERMISSIONS.TASK_REJECT, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.rejectTask));

module.exports = router;
