const express = require('express');
const { PERMISSIONS, USER_ROLES } = require('../../../../packages/shared/src');
const controller = require('../controllers/orchestration.controller');

const router = express.Router();

function attachActor(req, _res, next) {
  if (req.user) {
    return next();
  }

  const internalToken = req.get('x-internal-service-token');
  const configuredInternalToken = process.env.INTERNAL_SERVICE_TOKEN;
  const permissionsHeader = req.get('x-user-permissions');
  const rolesHeader = req.get('x-user-roles');
  const primaryRole = req.get('x-user-role');
  if (!primaryRole && !(configuredInternalToken && internalToken === configuredInternalToken)) {
    return next();
  }

  const effectivePrimaryRole =
    primaryRole || (configuredInternalToken && internalToken === configuredInternalToken ? USER_ROLES.SYSTEM : null);

  req.user = {
    id: req.get('x-user-id') || 'system-user',
    primaryRole: effectivePrimaryRole,
    roles: rolesHeader
      ? rolesHeader.split(',').map((value) => value.trim()).filter(Boolean)
      : [effectivePrimaryRole],
    permissions: permissionsHeader
      ? permissionsHeader.split(',').map((value) => value.trim()).filter(Boolean)
      : effectivePrimaryRole === USER_ROLES.SYSTEM
        ? [PERMISSIONS.SYSTEM_INTERNAL_CALL]
        : [],
    name: req.get('x-user-name') || effectivePrimaryRole
  };
  return next();
}

function requirePermission(...permissions) {
  return (req, res, next) => {
    const actor = req.user;
    if (!actor) {
      return res.status(401).json({ ok: false, error: { message: 'Authentication is required.' } });
    }
    const actorPermissions = new Set(actor.permissions || []);
    const isAdmin = actor.primaryRole === USER_ROLES.ADMIN || (actor.roles || []).includes(USER_ROLES.ADMIN);
    const isSystem = actor.primaryRole === USER_ROLES.SYSTEM || (actor.roles || []).includes(USER_ROLES.SYSTEM);
    if (isAdmin || isSystem || permissions.some((permission) => actorPermissions.has(permission))) {
      return next();
    }
    return res.status(403).json({ ok: false, error: { message: 'Access denied.' } });
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    const actorRoles = req.user?.roles || [];
    if (roles.includes(req.user?.primaryRole) || roles.some((role) => actorRoles.includes(role))) {
      return next();
    }
    return res.status(403).json({ ok: false, error: { message: 'Access denied.' } });
  };
}

router.use(attachActor);

router.post(
  '/api/v1/orchestration/cases/:caseId/transition',
  requirePermission(PERMISSIONS.CASE_UPDATE, PERMISSIONS.CASE_SUBMIT, PERMISSIONS.TASK_UPDATE),
  controller.transitionCase
);
router.post(
  '/api/v1/orchestration/tasks/:taskId/transition',
  requirePermission(PERMISSIONS.TASK_UPDATE, PERMISSIONS.TASK_ASSIGN, PERMISSIONS.TASK_APPROVE, PERMISSIONS.TASK_REJECT),
  controller.transitionTask
);
router.post(
  '/api/v1/orchestration/cases/:caseId/recalculate',
  requirePermission(PERMISSIONS.CASE_UPDATE, PERMISSIONS.SYSTEM_INTERNAL_CALL),
  controller.recalculateCase
);
router.post(
  '/api/v1/orchestration/cases/:caseId/replay',
  requireRole(USER_ROLES.ADMIN, USER_ROLES.AUDITOR, USER_ROLES.SYSTEM),
  controller.replayCase
);
router.get(
  '/api/v1/orchestration/cases/:caseId/state',
  requirePermission(PERMISSIONS.CASE_READ, PERMISSIONS.CASE_VIEW_ALL, PERMISSIONS.AUDIT_READ),
  controller.getCaseState
);
router.get(
  '/api/v1/orchestration/tasks/:taskId/state',
  requirePermission(PERMISSIONS.TASK_READ, PERMISSIONS.TASK_READ_DEPARTMENT, PERMISSIONS.AUDIT_READ),
  controller.getTaskState
);
router.post(
  '/api/v1/orchestration/sla/evaluate',
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SYSTEM),
  controller.evaluateSla
);

module.exports = router;
