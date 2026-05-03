const rateLimit = require('express-rate-limit');

const publicMetricsLimiter = rateLimit({
  windowMs: Number(process.env.PUBLIC_METRICS_RATE_LIMIT_WINDOW_MS || 900000),
  limit: Number(process.env.PUBLIC_METRICS_RATE_LIMIT_MAX || 120),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many public dashboard requests. Please try again later.'
});

module.exports = { publicMetricsLimiter };
