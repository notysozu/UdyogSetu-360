const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { env } = require('../../../web/src/config/env');
const { attachRequestContext } = require('../../../web/src/middleware/requestContext');
const { attachCurrentUser } = require('../../../web/src/middleware/current-user.middleware');
const { csrfPlaceholder } = require('../../../web/src/middleware/csrf-placeholder.middleware');
const { portalLocals } = require('./middleware/portal-locals.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/department-dashboard.routes');
const taskRoutes = require('./routes/department-task.routes');
const supervisorRoutes = require('./routes/supervisor.routes');
const nodalRoutes = require('./routes/nodal.routes');
const auditorRoutes = require('./routes/auditor.routes');
const departmentGrievanceRoutes = require('./routes/department-grievance.routes');
const departmentSlaRoutes = require('./routes/department-sla.routes');
const operationsRoutes = require('./routes/operations.routes');
const analyticsRoutes = require('./routes/analytics.routes');

function createApp() {
  const app = express();
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

  app.set('view engine', 'ejs');
  app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, '..', '..', '..', 'web', 'views')
  ]);
  app.use(expressLayouts);
  app.set('layout', 'layouts/department-layout');

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(morgan('dev'));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 180 }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(methodOverride('_method'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, '..', '..', '..', 'web', 'public')));
  app.use(session({
    name: 'us360.department.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: env.AUTH_COOKIE_SAME_SITE,
      secure: env.AUTH_COOKIE_SECURE,
      maxAge: env.AUTH_SESSION_MAX_AGE_MS
    }
  }));
  app.use(flash());
  app.use(attachRequestContext);
  app.use(attachCurrentUser);
  app.use(csrfPlaceholder);
  app.use(portalLocals);

  app.get('/', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const role = req.user.primaryRole || req.user.role;
    if (role === 'department_supervisor') return res.redirect('/supervisor');
    if (role === 'nodal_officer') return res.redirect('/nodal');
    if (role === 'auditor') return res.redirect('/audit');
    return res.redirect('/department');
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'department-portal',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded'
      }
    });
  });

  app.get('/ready', (_req, res) => {
    const ok = mongoose.connection.readyState === 1;
    res.status(ok ? 200 : 503).json({
      ok,
      service: 'department-portal',
      timestamp: new Date().toISOString(),
      dependencies: { mongodb: ok ? 'ok' : 'unavailable' }
    });
  });

  app.use(['/auth', '/login'], authLimiter);
  app.use('/', authRoutes);
  app.use('/', dashboardRoutes);
  app.use('/', taskRoutes);
  app.use('/', supervisorRoutes);
  app.use('/', nodalRoutes);
  app.use('/', auditorRoutes);
  app.use('/', departmentGrievanceRoutes);
  app.use('/', departmentSlaRoutes);
  app.use('/', operationsRoutes);
  app.use('/', analyticsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
