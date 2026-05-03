const metrics = require('./metrics-registry');

function httpMetricsMiddleware() {
  return (req, res, next) => {
    const startedAt = Date.now();
    metrics.incCounter('requests_total', 1, { method: req.method, route: req.path });
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      metrics.observeHistogram('request_duration_ms', durationMs, { method: req.method, route: req.path, status: String(res.statusCode) });
      if (res.statusCode >= 400) metrics.incCounter('error_count', 1, { method: req.method, route: req.path, status: String(res.statusCode) });
    });
    next();
  };
}

module.exports = {
  httpMetricsMiddleware
};
