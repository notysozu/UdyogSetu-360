const slaService = require('../../../notification-service/src/services/sla-monitoring.service');

function contextFromRequest(req) {
  return {
    userId: req.get('x-user-id') || null,
    role: req.get('x-user-role') || null,
    correlationId: req.correlationId || null,
    requestId: req.requestId || null,
    user: { actorType: 'user', actorId: req.get('x-user-id') || null, role: req.get('x-user-role') || null }
  };
}

function userFromRequest(req) {
  return {
    id: req.get('x-user-id') || null,
    _id: req.get('x-user-id') || null,
    role: req.get('x-user-role') || null,
    primaryRole: req.get('x-user-role') || null,
    departmentCode: req.get('x-department-code') || null
  };
}

async function approvalAgeing(req, res, next) {
  try {
    const data = await slaService.getApprovalAgeingDashboard(userFromRequest(req), req.query || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function grievanceAgeing(req, res, next) {
  try {
    const data = await slaService.getGrievanceAgeingDashboard(userFromRequest(req), req.query || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function evaluate(req, res, next) {
  try {
    const data = await slaService.evaluateAll(new Date(), contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function pause(req, res, next) {
  try {
    const data = await slaService.pauseTimer(req.params.timerId, req.body?.reason, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function resume(req, res, next) {
  try {
    const data = await slaService.resumeTimer(req.params.timerId, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function complete(req, res, next) {
  try {
    const data = await slaService.completeTimer(req.params.timerId, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function escalate(req, res, next) {
  try {
    const escalationService = require('../../../notification-service/src/services/escalation.service');
    const data = await escalationService.escalateEntity(
      req.body.entityType || 'task',
      req.body.entityId || req.params.timerId,
      req.body.reason || 'manual_escalation',
      contextFromRequest(req)
    );
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  approvalAgeing,
  grievanceAgeing,
  evaluate,
  pause,
  resume,
  complete,
  escalate
};
