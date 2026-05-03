const { PERMISSIONS, ROLE_PERMISSIONS, USER_ROLES } = require('../../../../packages/shared/src');

function resolveActor(req) {
  if (req.serviceUser) return req.serviceUser;
  const role = req.get('x-user-role');
  const permissionsHeader = req.get('x-user-permissions');
  if (!role) return null;
  const explicitPermissions = permissionsHeader
    ? permissionsHeader
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  return {
    id: req.get('x-user-id') || role,
    primaryRole: role,
    permissions: [...new Set([...explicitPermissions, ...(ROLE_PERMISSIONS[role] || [])])]
  };
}

function requireServiceAuth(req, _res, next) {
  const internalToken = req.get('x-internal-service-token');
  if (internalToken && internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
    req.serviceUser = {
      id: 'internal-service',
      primaryRole: USER_ROLES.SYSTEM,
      permissions: [PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.RETRY_MANAGE, PERMISSIONS.INTEGRATION_MANAGE]
    };
    return next();
  }
  return next();
}

function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    const actor = resolveActor(req);
    if (!actor) {
      return res.status(401).json({ ok: false, error: { message: 'Authentication required.' } });
    }
    if (!permissions.some((permission) => actor.permissions.includes(permission))) {
      return res.status(403).json({ ok: false, error: { message: 'Required permission is missing.' } });
    }
    req.user = actor;
    return next();
  };
}

module.exports = {
  requireServiceAuth,
  requireAnyPermission
};
