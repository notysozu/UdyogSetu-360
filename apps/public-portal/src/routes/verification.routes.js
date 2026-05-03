const express = require('express');
const controller = require('../controllers/public-verification.controller');
const { verificationLimiter } = require('../middleware/verification-rate-limit.middleware');
const { guardVerificationAttempts, captchaPlaceholder } = require('../middleware/anti-abuse.middleware');

const router = express.Router();

router.get('/verify', controller.showForm);
router.post('/verify', verificationLimiter, guardVerificationAttempts, captchaPlaceholder, controller.submitVerification);
router.get('/verify/certificate/:verificationToken', verificationLimiter, guardVerificationAttempts, controller.verifyByToken);
router.get('/verify/result/:verificationId', controller.showVerificationResult);

router.post('/api/v1/public/verify', verificationLimiter, guardVerificationAttempts, captchaPlaceholder, controller.apiVerify);
router.get('/api/v1/public/verify/certificate/:verificationToken', verificationLimiter, guardVerificationAttempts, controller.apiVerifyByToken);

router.post('/certificates/verify', verificationLimiter, guardVerificationAttempts, captchaPlaceholder, controller.submitVerification);
router.post('/api/certificates/verify', verificationLimiter, guardVerificationAttempts, captchaPlaceholder, (req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/v1/public/verify>; rel="successor-version"');
  return controller.apiVerify(req, res, next);
});

module.exports = router;
