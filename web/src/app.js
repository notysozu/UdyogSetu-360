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
const { env } = require('./config/env');
const { attachRequestContext } = require('./middleware/requestContext');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { attachLocals } = require('./middleware/locals');
const { attachCurrentUser } = require('./middleware/current-user.middleware');
const { csrfPlaceholder } = require('./middleware/csrf-placeholder.middleware');

const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const investorRoutes = require('./routes/investorRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditRoutes = require('./routes/auditRoutes');
const nodalRoutes = require('./routes/nodalRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const documentRoutes = require('./routes/documentRoutes');
const grievanceRoutes = require('./routes/grievanceRoutes');
const contactRoutes = require('./routes/contactRoutes');
const apiRoutes = require('./routes/apiRoutes');
const apiInternalRoutes = require('./routes/apiInternalRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const internalRoutes = require('./routes/internalRoutes');

function createApp() {
  const app = express();
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(morgan('dev'));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 180 }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(methodOverride('_method'));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(session({
    name: 'us360.sid',
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
  app.use((req, res, next) => {
    res.locals.accessibilityEnabled = true;
    next();
  });
  app.use(attachCurrentUser);
  app.use(csrfPlaceholder);
  app.use(attachLocals);

  app.use('/', indexRoutes);
  app.use(['/auth', '/login', '/register'], authLimiter);
  app.use('/', authRoutes);
  app.use('/', caseRoutes);
  app.use('/', certificateRoutes);
  app.use('/', documentRoutes);
  app.use('/', grievanceRoutes);
  app.use('/', contactRoutes);
  app.use('/investor', investorRoutes);
  app.use('/department', departmentRoutes);
  app.use('/nodal', nodalRoutes);
  app.use('/supervisor', supervisorRoutes);
  app.use('/admin', adminRoutes);
  app.use('/audit', auditRoutes);
  app.use('/internal', internalRoutes);
  app.use('/api/v1', apiRoutes);
  app.use('/api/internal', apiInternalRoutes);
  app.use('/webhooks', webhookRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
