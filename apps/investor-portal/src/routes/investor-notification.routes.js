const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const controller = require('../controllers/investor-notification.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();
router.use(requireInvestorAuth);

router.get('/notifications', asyncHandler(controller.listNotifications));
router.post('/notifications/:notificationId/read', asyncHandler(controller.markNotificationRead));
router.post('/notifications/mark-all-read', asyncHandler(controller.markAllRead));

module.exports = router;
