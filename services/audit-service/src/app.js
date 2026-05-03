const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/audit.routes');
const { getKafkaHealth } = require('../../../../packages/shared/src/kafka/kafka-client');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'audit-service',
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
      service: 'audit-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable',
        kafka: kafka.status
      }
    });
  });

  app.use('/', routes);
  return app;
}

module.exports = { createApp };
