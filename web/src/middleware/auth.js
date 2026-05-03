const { requireAuth, denyIfSuspended } = require('./auth.middleware');
const { requireRole } = require('./role.middleware');
const { requireServiceAuth } = require('./service-auth.middleware');

function requireLogin(req, res, next) {
  return requireAuth(req, res, next);
}

function requireApiAuth(req, res, next) {
  return requireAuth(req, res, next);
}

module.exports = {
  requireLogin,
  requireAuth,
  requireRole,
  requireApiAuth,
  requireServiceAuth,
  denyIfSuspended
};
