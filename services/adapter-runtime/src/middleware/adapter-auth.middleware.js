const { ROLE_PERMISSIONS, PERMISSIONS } = require('../../../../packages/shared/src');

function actorFromHeaders(req) {
  if (req.serviceUser) return req.serviceUser;
  const role = req.get('x-user-role');
  if (!role) return null;
  return {
    id: req.get('x-user-id') || role,
    primaryRole: role,
    permissions: [...new Set([...(ROLE_PERMISSIONS[role] || []), ...String(req.get('x-user-permissions') || '').split(',').filter(Boolean)])]
  };
}

function requireServiceOrPermission(...permissions) {
  return (req, res, next) => {
    const internalToken = req.get('x-internal-service-token');
    if (internalToken && internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
      req.serviceUser = {
        id: 'internal-service',
        primaryRole: 'system',
        permissions: [PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE, PERMISSIONS.AUDIT_READ]
      };
      return next();
    }
    const actor = actorFromHeaders(req);
    if (!actor) {
      return res.status(401).json({ ok: false, error: { message: 'Authentication required.' } });
    }
    if (!permissions.some((permission) => actor.permissions.includes(permission))) {
      return res.status(403).json({ ok: false, error: { message: 'Required permission missing.' } });
    }
    req.user = actor;
    return next();
  };
}

module.exports = { requireServiceOrPermission };
