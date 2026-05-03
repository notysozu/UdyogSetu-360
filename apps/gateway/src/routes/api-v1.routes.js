const express = require('express');
const { getOpenApiDocument } = require('../services/api-contract.service');
const caseRoutes = require('./case.routes');
const taskRoutes = require('./task.routes');
const documentRoutes = require('./document.routes');
const eventRoutes = require('./event.routes');
const certificateRoutes = require('./certificate.routes');
const grievanceRoutes = require('./grievance.routes');
const dashboardRoutes = require('./dashboard.routes');
const diagnosticsRoutes = require('./diagnostics.routes');
const replayRoutes = require('./replay.routes');
const auditRoutes = require('./audit.routes');
const analyticsRoutes = require('./analytics.routes');
const { getHealth, getReady } = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', getHealth);
router.get('/ready', getReady);
router.get('/openapi.json', (_req, res) => res.json(getOpenApiDocument()));
router.get('/docs', (_req, res) => {
  const html = `<!doctype html>
  <html lang="en">
    <head><meta charset="utf-8"><title>UdyogSetu 360 API Docs</title></head>
    <body style="font-family: Arial, sans-serif; margin: 2rem;">
      <h1>UdyogSetu 360 API</h1>
      <p>OpenAPI 3.1 document:</p>
      <p><a href="/api/v1/openapi.json">/api/v1/openapi.json</a></p>
    </body>
  </html>`;
  res.type('html').send(html);
});

router.use(caseRoutes);
router.use(taskRoutes);
router.use(documentRoutes);
router.use(eventRoutes);
router.use(certificateRoutes);
router.use(grievanceRoutes);
router.use(dashboardRoutes);
router.use(diagnosticsRoutes);
router.use(replayRoutes);
router.use(auditRoutes);
router.use(analyticsRoutes);

module.exports = router;
