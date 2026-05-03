const rateLimit = require('express-rate-limit');
const { getGatewayConfig } = require('../config/gateway.config');
const { AppError } = require('../utils/app-error');

function buildLimiter({ max, windowMs, message }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, _res, next) {
      next(new AppError('RATE_LIMITED', message, 429));
    }
  });
}

function createRateLimiters() {
  const config = getGatewayConfig();
  return {
    globalApiLimiter: buildLimiter({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMax,
      message: 'Too many API requests. Please try again later.'
    }),
    authSensitiveLimiter: buildLimiter({
      windowMs: config.rateLimitWindowMs,
      max: 20,
      message: 'Too many authentication-sensitive requests.'
    }),
    webhookLimiter: buildLimiter({
      windowMs: 60 * 1000,
      max: config.webhookRateLimitMax,
      message: 'Too many webhook requests.'
    }),
    certificateLimiter: buildLimiter({
      windowMs: config.rateLimitWindowMs,
      max: config.certVerifyRateLimitMax,
      message: 'Too many certificate verification requests.'
    }),
    dashboardLimiter: buildLimiter({
      windowMs: config.rateLimitWindowMs,
      max: config.dashboardRateLimitMax,
      message: 'Too many dashboard requests.'
    })
  };
}

module.exports = { createRateLimiters };
