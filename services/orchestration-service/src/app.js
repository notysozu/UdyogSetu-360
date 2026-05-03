const express = require('express');
const mongoose = require('mongoose');
const { ok } = require('../../../../packages/shared/src/utils/apiResponse');
const { getKafkaHealth } = require('../../../../packages/shared/src/kafka/kafka-client');
const orchestrationRoutes = require('./routes/orchestration.routes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'orchestration-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
        kafka: getKafkaHealth().status
      }
    });
  });

  app.get('/ready', (_req, res) => {
    const kafka = getKafkaHealth();
    const healthy =
      mongoose.connection.readyState === 1 &&
      (kafka.status === 'ok' || kafka.status === 'disabled' || kafka.status === 'configured');
    res.status(healthy ? 200 : 503).json({
      ok: healthy,
      service: 'orchestration-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable',
        kafka: kafka.status
      }
    });
  });

  app.get('/transitions', (_req, res) => {
    res.json(ok({ message: 'Lifecycle validation lives in state-machines/case-lifecycle.js' }));
  });

  app.use(orchestrationRoutes);

  return app;
}

module.exports = { createApp };
