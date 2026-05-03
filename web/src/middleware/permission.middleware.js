const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../services/permissionService');

function permissionError(message = 'Permission required.') {
  const error = new Error(message);
  error.status = 403;
  error.code = 'PERMISSION_REQUIRED';
  return error;
}

function requirePermission(...permissions) {
  return (req, _res, next) => {
    const allowed = permissions.every((permission) => hasPermission(req.user, permission));
    if (!allowed) return next(permissionError('You do not have permission to access this resource.'));
    next();
  };
}

function requireAnyPermission(...permissions) {
  return (req, _res, next) => {
    if (!hasAnyPermission(req.user, permissions)) return next(permissionError());
    next();
  };
}

function requireAllPermissions(...permissions) {
  return (req, _res, next) => {
    if (!hasAllPermissions(req.user, permissions)) return next(permissionError());
    next();
  };
}

module.exports = { requirePermission, requireAnyPermission, requireAllPermissions };
