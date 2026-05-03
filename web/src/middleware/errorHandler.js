const { failure } = require('../utils/response');

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  console.error(`[${req.correlationId}]`, error);

  if (status === 403 && req.user) {
    const { audit } = require('../services/auditLogService');
    const { AUDIT_ACTIONS } = require('../../../packages/shared/src');
    audit(AUDIT_ACTIONS.AUTH_ACCESS_DENIED, 'route', req.originalUrl, {
      user: req.user,
      correlationId: req.correlationId,
      requestId: req.requestId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null
    }, {
      metadata: { message: error.message, method: req.method }
    }).catch(() => {});
  }

  if (req.originalUrl.startsWith('/api/')) {
    return failure(
      res,
      status,
      error.code || (status === 401 ? 'AUTH_REQUIRED' : status === 403 ? 'ACCESS_DENIED' : 'INTERNAL_ERROR'),
      error.message || 'Internal server error'
    );
  }

  if (status === 403) {
    return res.status(status).render('pages/403', {
      title: 'Access denied',
      status,
      message: error.message || 'Access denied'
    });
  }

  return res.status(status).render('pages/error', {
    title: 'Something went wrong',
    status,
    message: error.message || 'Internal server error'
  });
}

module.exports = { notFound, errorHandler };
