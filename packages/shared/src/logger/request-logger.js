const crypto = require('crypto');

function hashIp(ip = '') {
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16);
}

function requestLoggerMiddleware(logger) {
  return (req, res, next) => {
    const startedAt = Date.now();
    logger?.debug?.('request_started', {
      method: req.method,
      path: req.originalUrl,
      correlationId: req.context?.correlationId || req.correlationId,
      requestId: req.context?.requestId || req.requestId
    });

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const meta = {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs,
        contentLength: res.getHeader('content-length') || null,
        ipHash: hashIp(req.ip),
        userAgent: req.get('user-agent') || null,
        userId: req.user?.id || req.user?._id || req.context?.actor?.id || null,
        role: req.user?.primaryRole || req.user?.role || req.context?.actor?.role || null,
        correlationId: req.context?.correlationId || req.correlationId || null,
        requestId: req.context?.requestId || req.requestId || null
      };
      if (res.statusCode >= 500) logger?.error?.('request_failed', meta);
      else if (res.statusCode >= 400) logger?.warn?.('request_failed', meta);
      else logger?.info?.('request_completed', meta);
    });

    next();
  };
}

module.exports = {
  requestLoggerMiddleware
};
