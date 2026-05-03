const express = require('express');
const routes = require('./routes/adapter.routes');
const { getKafkaHealth } = require('../../../../packages/shared/src/kafka/kafka-client');
const { correlationIdMiddleware } = require('../../../../packages/shared/src/middleware/correlation-id');
const { getRabbitHealth } = require('../../../../packages/shared/src/rabbitmq/rabbitmq-client');
const queueRoutes = require('./routes/queue.routes');
const queueMonitoringService = require('./services/queue-monitoring.service');
const mongoose = require('mongoose');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(correlationIdMiddleware);

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'adapter-runtime',
      timestamp: new Date().toISOString(),
      dependencies: {
        adapters: 'ok',
        kafka: getKafkaHealth().status,
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
        rabbitmq: getRabbitHealth().status
      }
    });
  });

  app.get('/ready', async (_req, res) => {
    const kafka = getKafkaHealth();
    const rabbit = getRabbitHealth();
    const queueHealth = await queueMonitoringService.buildQueueHealthReport();
    const rabbitOk =
      rabbit.status === 'ok' || rabbit.status === 'disabled' || (process.env.NODE_ENV !== 'production' && rabbit.status === 'configured');
    const ok =
      mongoose.connection.readyState === 1 &&
      kafka.status !== 'degraded' &&
      (process.env.NODE_ENV === 'production' ? rabbitOk : true);

    res.status(ok ? 200 : 503).json({
      ok,
      service: 'adapter-runtime',
      timestamp: new Date().toISOString(),
      dependencies: {
        adapters: 'ok',
        kafka: kafka.status,
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable',
        rabbitmq: rabbit.status,
        queues: queueHealth.queues
      },
      queueHealth
    });
  });

  app.use('/', routes);
  app.use('/', queueRoutes);

  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || error.status || 500).json({
      ok: false,
      error: {
        message: error.message || 'Unexpected adapter runtime error'
      }
    });
  });

  return app;
}

module.exports = { createApp };
