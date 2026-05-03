const { createHash } = require('crypto');
const { validateMetricsFilters } = require('../validators/public-metrics.validators');
const verificationRepository = require('../repositories/public-verification.repository');

function hashValue(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

function validateMetricsRequest(req, res, next) {
  const { errors, value } = validateMetricsFilters(req.query);
  if (errors.length) {
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: errors[0] },
        meta: { correlationId: req.correlationId, timestamp: new Date().toISOString() }
      });
    }
    return res.status(400).render('verification/verify-invalid', { title: 'Invalid Request', message: errors[0] });
  }
  req.publicMetricsFilters = value;
  return next();
}

async function guardVerificationAttempts(req, res, next) {
  const ipHash = hashValue(req.ip || '');
  const failedCount = await verificationRepository.countRecentFailedAttemptsByIpHash(
    ipHash,
    Number(process.env.PUBLIC_VERIFY_RATE_LIMIT_WINDOW_MS || 900000)
  ).catch(() => 0);
  if (failedCount >= Number(process.env.PUBLIC_VERIFY_MAX_FAILED_ATTEMPTS_PER_IP || 25)) {
    const message = 'Verification is temporarily unavailable from this address. Please try again later.';
    if (req.path.startsWith('/api/')) {
      return res.status(429).json({
        success: false,
        data: null,
        error: { message },
        meta: { correlationId: req.correlationId, timestamp: new Date().toISOString() }
      });
    }
    return res.status(429).render('verification/verify-invalid', { title: 'Verification Temporarily Limited', message });
  }
  return next();
}

function captchaPlaceholder(req, res, next) {
  if (String(process.env.PUBLIC_VERIFY_ENABLE_CAPTCHA_PLACEHOLDER || 'false') !== 'true') return next();
  if (req.method === 'POST' && !req.body.captchaPlaceholder) {
    const message = 'Please confirm you are submitting a manual verification request.';
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message },
        meta: { correlationId: req.correlationId, timestamp: new Date().toISOString() }
      });
    }
    return res.status(400).render('verification/verify-invalid', { title: 'Verification Check Required', message });
  }
  return next();
}

module.exports = {
  validateMetricsRequest,
  guardVerificationAttempts,
  captchaPlaceholder
};
