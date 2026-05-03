const path = require('path');
const { randomUUID } = require('crypto');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { attachRequestContext } = require('../../../web/src/middleware/requestContext');
const publicRoutes = require('./routes/public.routes');
const verificationRoutes = require('./routes/verification.routes');
const viewHelpers = require('./helpers/view.helpers');

function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', [path.join(__dirname, 'views')]);
  app.use(expressLayouts);
  app.set('layout', 'layouts/public-layout');

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: '128kb' }));
  app.use(cookieParser());
  app.use(methodOverride('_method'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(attachRequestContext);
  app.use((req, res, next) => {
    req.requestId = req.get('x-request-id') || randomUUID();
    res.setHeader('x-request-id', req.requestId);
    res.locals.correlationId = req.correlationId;
    res.locals.requestId = req.requestId;
    res.locals.view = viewHelpers;
    res.locals.currentPath = req.path;
    res.locals.pageTitle = 'UdyogSetu 360 Public Dashboard';
    next();
  });

  app.get('/', (_req, res) => res.redirect('/public/dashboard'));
  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'public-portal',
      timestamp: new Date().toISOString(),
      dependencies: { mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded' }
    });
  });
  app.get('/ready', (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    res.status(mongoOk ? 200 : 503).json({
      ok: mongoOk,
      service: 'public-portal',
      timestamp: new Date().toISOString(),
      publicMetrics: mongoOk ? 'ok' : 'degraded',
      cache: String(process.env.PUBLIC_METRICS_CACHE_ENABLED || 'true') === 'true' ? 'ok' : 'disabled',
      verification: mongoOk ? 'ok' : 'degraded'
    });
  });

  app.use('/', publicRoutes);
  app.use('/', verificationRoutes);

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { message: 'Route not found.' },
        meta: { correlationId: req.correlationId, timestamp: new Date().toISOString() }
      });
    }
    return res.status(404).render('errors/404', { title: 'Page Not Found' });
  });

  app.use((error, req, res, _next) => {
    const status = error.status || error.statusCode || 500;
    if (req.path.startsWith('/api/')) {
      return res.status(status).json({
        success: false,
        data: null,
        error: { message: error.message || 'Unexpected error.' },
        meta: { correlationId: req.correlationId, timestamp: new Date().toISOString() }
      });
    }
    return res.status(status >= 500 ? 500 : status).render(`errors/${status >= 500 ? 500 : status}`, {
      title: status === 403 ? 'Access Denied' : 'Something Went Wrong',
      error
    });
  });

  return app;
}

module.exports = { createApp };
