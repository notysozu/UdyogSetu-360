const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/notification.routes');
const grievanceRoutes = require('./routes/grievance.routes');
const slaRoutes = require('./routes/sla.routes');
const communicationRoutes = require('./routes/communication.routes');
const { getKafkaHealth } = require('../../../../packages/shared/src/kafka/kafka-client');
const { startScheduler } = require('./scheduler');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
        kafka: getKafkaHealth().status
      }
    });
  });

  app.get('/ready', (_req, res) => {
    const kafka = getKafkaHealth();
    const ok =
      mongoose.connection.readyState === 1 &&
      (kafka.status === 'ok' || kafka.status === 'disabled' || kafka.status === 'configured');
    res.status(ok ? 200 : 503).json({
      ok,
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable',
        kafka: kafka.status
      }
    });
  });

  app.use('/', routes);
  app.use('/', grievanceRoutes);
  app.use('/', slaRoutes);
  app.use('/', communicationRoutes);
  app.use((error, _req, res, _next) => {
    res.status(error.status || error.statusCode || 500).json({
      success: false,
      data: null,
      error: { message: error.message || 'Unexpected error.' }
    });
  });
  startScheduler();
  return app;
}

module.exports = { createApp };
