const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const controller = require('../controllers/investor.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();

router.get(['/dashboard', '/investor', '/investor/dashboard'], requireInvestorAuth, asyncHandler(controller.showDashboard));
router.get('/profile', requireInvestorAuth, asyncHandler(controller.showProfile));
router.post('/profile', requireInvestorAuth, asyncHandler(controller.updateProfile));
router.get('/settings', requireInvestorAuth, asyncHandler(controller.showSettings));
router.post('/settings/language', requireInvestorAuth, asyncHandler(controller.updateLanguage));
router.post('/settings/notification-preferences', requireInvestorAuth, asyncHandler(controller.updateNotificationPreferences));

module.exports = router;
