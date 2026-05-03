const rateLimit = require('express-rate-limit');

const verificationLimiter = rateLimit({
  windowMs: Number(process.env.PUBLIC_VERIFY_RATE_LIMIT_WINDOW_MS || 900000),
  limit: Number(process.env.PUBLIC_VERIFY_RATE_LIMIT_MAX || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many verification requests. Please try again later.'
});

module.exports = { verificationLimiter };
