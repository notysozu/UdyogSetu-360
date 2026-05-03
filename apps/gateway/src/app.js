const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const indexRoutes = require('./routes/index.routes');
const { getGatewayConfig } = require('./config/gateway.config');
const { correlationMiddleware } = require('./middleware/correlation.middleware');
const { attachCurrentActor } = require('./middleware/auth.middleware');
const { responseEnvelopeMiddleware } = require('./middleware/response-envelope.middleware');
const { requestLoggerMiddleware } = require('./middleware/request-logger.middleware');
const { httpMetricsMiddleware } = require('../../../packages/shared/src/metrics/http-metrics.middleware');
const { createMetricsRouter } = require('../../../packages/shared/src/metrics/metrics.routes');
const { createRateLimiters } = require('./middleware/rate-limit.middleware');
const { notFoundMiddleware } = require('./middleware/not-found.middleware');
const { errorMiddleware } = require('./middleware/error.middleware');

function rawBodySaver(req, _res, buffer) {
  if (buffer?.length) {
    req.rawBody = buffer.toString('utf8');
  }
}

function createCorsOptions(config) {
  const allowAll = config.corsOrigins.includes('*');
  if (allowAll) {
    return { origin: true, credentials: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  };
}

function createApp() {
  const app = express();
  const config = getGatewayConfig();
  const rateLimiters = createRateLimiters();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(cors(createCorsOptions(config)));

  app.use(correlationMiddleware);
  app.use(responseEnvelopeMiddleware);
  app.use(attachCurrentActor);

  app.use(
    express.json({
      limit: config.bodyLimitJson,
      verify: rawBodySaver,
      type: ['application/json', 'application/cloudevents+json']
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: config.bodyLimitUrlencoded,
      verify: rawBodySaver
    })
  );

  app.use('/api', rateLimiters.globalApiLimiter);
  if (String(process.env.METRICS_ENABLED || 'true') === 'true') {
    app.use(httpMetricsMiddleware());
  }
  app.use(requestLoggerMiddleware());
  app.use(indexRoutes);
  if (String(process.env.METRICS_ROUTE_ENABLED || 'true') === 'true') {
    app.use(createMetricsRouter());
  }
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
