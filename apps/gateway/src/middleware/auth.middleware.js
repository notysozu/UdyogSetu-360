const jwt = require('jsonwebtoken');
const { getGatewayConfig } = require('../config/gateway.config');
const { AppError } = require('../utils/app-error');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('../../../../packages/shared/src');

function attachActorFromClaims(req, claims) {
  req.user = {
    id: claims.sub,
    email: claims.email,
    roles: claims.roles || [],
    primaryRole: claims.primaryRole,
    permissions: claims.permissions || [],
    organisationId: claims.organisationId || null,
    departmentId: claims.departmentId || null,
    investorId: claims.investorId || null,
    tokenType: claims.tokenType
  };
  req.context.actor = req.user;
}

function attachCurrentActor(req, _res, next) {
  const config = getGatewayConfig();
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const claims = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience
    });
    attachActorFromClaims(req, claims);
  } catch (_error) {
    // Non-blocking attachment. Route-level auth middleware decides whether this matters.
  }

  return next();
}

function requireAuth(req, _res, next) {
  const config = getGatewayConfig();
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new AppError('AUTH_REQUIRED', 'Authentication is required.', 401));
  }

  try {
    const claims = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience
    });
    attachActorFromClaims(req, claims);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('TOKEN_EXPIRED', 'Access token has expired.', 401));
    }
    return next(new AppError('TOKEN_INVALID', 'Access token is invalid.', 401));
  }
}

function requireServiceAuth(req, _res, next) {
  const config = getGatewayConfig();
  const header = req.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const staticToken = req.get('x-internal-service-token');

  try {
    if (bearer) {
      const claims = jwt.verify(bearer, config.serviceJwtSecret, {
        issuer: config.jwtIssuer,
        audience: 'udyogsetu-360-internal'
      });
      req.serviceUser = {
        id: claims.sub,
        primaryRole: 'system',
        permissions: [PERMISSIONS.SYSTEM_INTERNAL_CALL],
        serviceName: claims.serviceName || claims.sub
      };
      req.context.actor = req.serviceUser;
      return next();
    }
  } catch (_error) {
    // fall back to static token
  }

  if (staticToken && staticToken === config.internalServiceToken) {
    req.serviceUser = {
      id: 'internal-static-token',
      primaryRole: 'system',
      permissions: [PERMISSIONS.SYSTEM_INTERNAL_CALL],
      serviceName: 'static-token'
    };
    req.context.actor = req.serviceUser;
    return next();
  }

  return next(
    new AppError('SERVICE_AUTH_REQUIRED', 'Service authentication is required.', 401)
  );
}

function allowServiceAuthOrVerifiedWebhook(req, _res, next) {
  const header = req.get('authorization') || '';
  const staticToken = req.get('x-internal-service-token');

  if (header.startsWith('Bearer ') || staticToken) {
    return requireServiceAuth(req, _res, next);
  }

  if (req.context?.webhook?.verified || req.context?.webhook?.bypassed) {
    req.serviceUser = {
      id: req.context.webhook.webhookId || 'verified-webhook',
      primaryRole: 'system',
      permissions: [PERMISSIONS.SYSTEM_INTERNAL_CALL],
      serviceName: 'verified-webhook'
    };
    req.context.actor = req.serviceUser;
    return next();
  }

  return next(
    new AppError(
      'SERVICE_AUTH_REQUIRED',
      'A verified webhook or service authentication is required.',
      401
    )
  );
}

function requirePermission(...permissions) {
  return (req, _res, next) => {
    const actor = req.user || req.serviceUser;
    if (!actor) {
      return next(new AppError('AUTH_REQUIRED', 'Authentication is required.', 401));
    }
    const rolePermissions = actor?.roles
      ? actor.roles.flatMap((role) => ROLE_PERMISSIONS[role] || [])
      : ROLE_PERMISSIONS[actor?.primaryRole] || [];
    const allPermissions = new Set([...(actor?.permissions || []), ...rolePermissions]);

    if (!permissions.every((permission) => allPermissions.has(permission))) {
      return next(new AppError('ACCESS_DENIED', 'Required permission is missing.', 403));
    }
    next();
  };
}

function requireAnyPermission(...permissions) {
  return (req, _res, next) => {
    const actor = req.user || req.serviceUser;
    if (!actor) {
      return next(new AppError('AUTH_REQUIRED', 'Authentication is required.', 401));
    }
    const rolePermissions = actor?.roles
      ? actor.roles.flatMap((role) => ROLE_PERMISSIONS[role] || [])
      : ROLE_PERMISSIONS[actor?.primaryRole] || [];
    const allPermissions = new Set([...(actor?.permissions || []), ...rolePermissions]);

    if (!permissions.some((permission) => allPermissions.has(permission))) {
      return next(new AppError('ACCESS_DENIED', 'Any of the required permissions is missing.', 403));
    }
    next();
  };
}

module.exports = {
  attachCurrentActor,
  requireAuth,
  requireServiceAuth,
  allowServiceAuthOrVerifiedWebhook,
  requirePermission,
  requireAnyPermission
};
