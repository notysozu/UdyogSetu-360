const express = require('express');
const metrics = require('./metrics-registry');

function metricsAuth(req, res, next) {
  if (String(process.env.METRICS_REQUIRE_AUTH || 'true') !== 'true') return next();
  const role = req.user?.primaryRole || req.user?.role || req.context?.actor?.role;
  if (['admin', 'system', 'auditor'].includes(role)) return next();
  return res.status(403).json({ success: false, data: null, error: { message: 'Forbidden' } });
}

function createMetricsRouter() {
  const router = express.Router();
  router.get('/metrics', metricsAuth, (_req, res) => {
    res.type('text/plain').send(metrics.toPrometheusText());
  });
  router.get('/api/v1/diagnostics/metrics', metricsAuth, (_req, res) => {
    res.type('text/plain').send(metrics.toPrometheusText());
  });
  router.get('/api/v1/diagnostics/metrics/json', metricsAuth, (_req, res) => {
    res.json({ success: true, data: metrics.snapshot(), error: null });
  });
  return router;
}

module.exports = {
  createMetricsRouter
};
