const { ROLE_PERMISSIONS, PERMISSIONS } = require('../../../packages/shared/src');

function resolvePermissions(user) {
  const rolePermissions = (user.roles || [user.role]).flatMap((role) => ROLE_PERMISSIONS[role] || []);
  return [...new Set([...(user.permissions || []), ...rolePermissions])];
}

function hasPermission(user, permission) {
  return resolvePermissions(user).includes(permission);
}

function hasAnyPermission(user, permissions) {
  return permissions.some((permission) => hasPermission(user, permission));
}

function hasAllPermissions(user, permissions) {
  return permissions.every((permission) => hasPermission(user, permission));
}

function isAdminLike(user) {
  return Boolean(user && ['admin', 'auditor', 'nodal_officer'].includes(user.primaryRole || user.role));
}

module.exports = {
  PERMISSIONS,
  resolvePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdminLike
};
