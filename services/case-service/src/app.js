const express = require('express');
const mongoose = require('mongoose');
const { correlationIdMiddleware } = require('../../../packages/shared/src/middleware/correlation-id');
const { createLogger } = require('../../../packages/shared/src/logger');
const { getKafkaHealth } = require('../../../packages/shared/src/kafka/kafka-client');
const routes = require('./routes/case.routes');
const documentRoutes = require('./routes/document.routes');
const certificateRoutes = require('./routes/certificate.routes');
const digilockerRoutes = require('./routes/digilocker.routes');
const grievanceRoutes = require('./routes/grievance.routes');
const slaRoutes = require('./routes/sla.routes');
const communicationRoutes = require('./routes/communication.routes');
const aiRoutes = require('./routes/ai.routes');
const { getStorageProvider } = require('./storage/storage-provider.factory');

function createApp() {
  const app = express();
  const logger = createLogger('case-service');

  app.use(express.json({ limit: '2mb' }));
  app.use(correlationIdMiddleware);
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      logger.info('request_complete', {
        correlationId: req.correlationId,
        requestId: req.requestId,
        route: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
      });
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'case-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
        kafka: getKafkaHealth().status,
        outbox: 'ok'
      }
    });
  });

  app.get('/ready', async (_req, res) => {
    const kafka = getKafkaHealth();
    const storageHealth = await getStorageProvider()
      .then((provider) => provider.healthCheck())
      .catch((error) => ({ ok: false, message: error.message }));
    const ok = mongoose.connection.readyState === 1 && (kafka.status === 'ok' || kafka.status === 'disabled' || kafka.status === 'configured');
    res.status(ok ? 200 : 503).json({
      ok,
      service: 'case-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable',
        kafka: kafka.status,
        outbox: 'ok',
        documentStorage: storageHealth.ok ? 'ok' : 'degraded',
        s3Bucket: storageHealth.ok ? 'ok' : 'degraded',
        digilocker:
          String(process.env.DIGILOCKER_ENABLED || 'false') === 'true'
            ? 'configured'
            : String(process.env.DIGILOCKER_ALLOW_SANDBOX_MOCK || 'true') === 'true'
              ? 'mock'
              : 'disabled',
        scanning: String(process.env.DOCUMENT_ENABLE_SCANNING || 'false') === 'true' ? 'enabled' : 'disabled'
      },
      storageHealth
    });
  });

  app.use('/', routes);
  app.use('/', documentRoutes);
  app.use('/', certificateRoutes);
  app.use('/', digilockerRoutes);
  app.use('/', grievanceRoutes);
  app.use('/', slaRoutes);
  app.use('/', communicationRoutes);
  app.use('/', aiRoutes);

  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({
      ok: false,
      error: {
        message: error.message || 'Unexpected case service error'
      }
    });
  });

  return app;
}

module.exports = { createApp };
