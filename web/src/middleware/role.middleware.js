function requireRole(...roles) {
  return (req, _res, next) => {
    const currentRole = req.user?.primaryRole || req.user?.role;
    if (!req.user) {
      const error = new Error('Authentication is required.');
      error.status = 401;
      error.code = 'AUTH_REQUIRED';
      return next(error);
    }
    if (!roles.includes(currentRole)) {
      const error = new Error('Required role missing.');
      error.status = 403;
      error.code = 'ROLE_REQUIRED';
      return next(error);
    }
    next();
  };
}

module.exports = { requireRole };
