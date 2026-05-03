const express = require('express');
const controller = require('../controllers/replay.controller');
const { asyncHandler } = require('../../../../packages/shared/src/utils/asyncHandler');
const { validateBody } = require('../middleware/validation.middleware');
const validators = require('../validators/replay.validators');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src/constants/permission.constants');

const router = express.Router();
router.use('/replay', requireAnyPermission(PERMISSIONS.REPLAY_VIEW, PERMISSIONS.REPLAY_EXECUTE, PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.AUDIT_READ));

router.get('/replay/attempts', asyncHandler(controller.listAttempts));
router.get('/replay/attempts/:replayId', asyncHandler(controller.getAttempt));
router.post('/replay', requireAnyPermission(PERMISSIONS.REPLAY_EXECUTE, PERMISSIONS.SYSTEM_INTERNAL_CALL), validateBody(validators.replayBody), asyncHandler(controller.requestReplay));
router.post('/replay/:replayId/cancel', requireAnyPermission(PERMISSIONS.REPLAY_EXECUTE, PERMISSIONS.SYSTEM_INTERNAL_CALL), asyncHandler(controller.cancelReplay));
router.post('/replay/case/:universalCaseId', requireAnyPermission(PERMISSIONS.REPLAY_EXECUTE, PERMISSIONS.SYSTEM_INTERNAL_CALL), validateBody(validators.replayBody), asyncHandler(controller.replayByCase));
router.post('/replay/dead-letter/:messageId', requireAnyPermission(PERMISSIONS.REPLAY_EXECUTE, PERMISSIONS.SYSTEM_INTERNAL_CALL), validateBody(validators.replayBody), asyncHandler(controller.replayByDeadLetter));

module.exports = router;
