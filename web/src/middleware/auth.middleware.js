const { loginPathWithNext } = require('../utils/navigation');

function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.originalUrl.startsWith('/api/')) {
      const error = new Error('Authentication is required.');
      error.status = 401;
      error.code = 'AUTH_REQUIRED';
      return next(error);
    }
    req.flash('error', 'Please sign in first.');
    return res.redirect(loginPathWithNext(req.originalUrl));
  }
  next();
}

function denyIfSuspended(req, _res, next) {
  if (!req.userDoc) return next();
  if (['suspended', 'disabled'].includes(req.userDoc.status)) {
    const error = new Error('Account is not allowed to access this resource.');
    error.status = 403;
    error.code = req.userDoc.status === 'disabled' ? 'ACCOUNT_DISABLED' : 'ACCESS_DENIED';
    return next(error);
  }
  next();
}

module.exports = { requireAuth, denyIfSuspended };
