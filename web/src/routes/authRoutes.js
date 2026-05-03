const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const {
  showLogin,
  showRegister,
  login,
  register,
  logout,
  apiToken,
  refreshToken,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  sendOtp,
  verifyOtp,
  showSessions,
  revokeSession,
  logoutAll,
  ssoStart,
  ssoCallback
} = require('../controllers/authController');

const router = express.Router();

router.get(['/login', '/auth/login'], showLogin);
router.post(['/login', '/auth/login'], asyncHandler(login));
router.get(['/register', '/auth/register'], asyncHandler(showRegister));
router.post(['/register', '/auth/register'], asyncHandler(register));
router.post(['/logout', '/auth/logout'], asyncHandler(logout));
router.post('/auth/api-token', asyncHandler(apiToken));
router.post('/auth/refresh', asyncHandler(refreshToken));
router.get('/auth/forgot-password', showForgotPassword);
router.post('/auth/forgot-password', asyncHandler(forgotPassword));
router.get('/auth/reset-password/:token', showResetPassword);
router.post('/auth/reset-password/:token', asyncHandler(resetPassword));
router.post('/auth/send-email-verification', requireAuth, asyncHandler(sendEmailVerification));
router.get('/auth/verify-email/:token', asyncHandler(verifyEmail));
router.post('/auth/send-otp', requireAuth, asyncHandler(sendOtp));
router.post('/auth/verify-otp', requireAuth, asyncHandler(verifyOtp));
router.get('/auth/sessions', requireAuth, asyncHandler(showSessions));
router.delete('/auth/sessions/:sessionId', requireAuth, asyncHandler(revokeSession));
router.post('/auth/logout-all', requireAuth, asyncHandler(logoutAll));
router.get('/auth/sso/start', asyncHandler(ssoStart));
router.get('/auth/sso/callback', asyncHandler(ssoCallback));

module.exports = router;
