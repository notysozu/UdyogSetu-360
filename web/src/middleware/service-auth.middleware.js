const { env } = require('../config/env');
const { verifyServiceToken } = require('../services/tokenService');

function requireServiceAuth(req, _res, next) {
  const bearer = req.get('authorization') || '';
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : null;
  const internalToken = req.get('x-internal-service-token');

  try {
    if (token) {
      const payload = verifyServiceToken(token);
      req.serviceUser = {
        id: payload.sub,
        role: 'system',
        primaryRole: 'system',
        permissions: ['system.internal_call'],
        serviceName: payload.serviceName
      };
      return next();
    }
  } catch (_error) {
    // fall through to static token validation
  }

  if (internalToken && internalToken === env.INTERNAL_SERVICE_TOKEN) {
    req.serviceUser = {
      id: 'internal-service',
      role: 'system',
      primaryRole: 'system',
      permissions: ['system.internal_call'],
      serviceName: 'static-internal-token'
    };
    return next();
  }

  const error = new Error('Service authentication is required.');
  error.status = 401;
  error.code = 'SERVICE_AUTH_REQUIRED';
  return next(error);
}

function requireInternalCall(req, res, next) {
  return requireServiceAuth(req, res, next);
}

module.exports = { requireServiceAuth, requireInternalCall };
