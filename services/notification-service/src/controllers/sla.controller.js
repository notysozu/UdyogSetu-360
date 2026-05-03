const slaService = require('../services/sla-monitoring.service');
const escalationService = require('../services/escalation.service');

function contextFromRequest(req) {
  return {
    userId: req.get('x-user-id') || null,
    role: req.get('x-user-role') || null,
    departmentCode: req.get('x-department-code') || null,
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

async function approvalAgeing(req, res) {
  const data = await slaService.getApprovalAgeingDashboard(userFromRequest(req), req.query || {}, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function grievanceAgeing(req, res) {
  const data = await slaService.getGrievanceAgeingDashboard(userFromRequest(req), req.query || {}, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function evaluate(req, res) {
  const data = await slaService.evaluateAll(new Date(), contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function pause(req, res) {
  const data = await slaService.pauseTimer(req.params.timerId, req.body?.reason, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function resume(req, res) {
  const data = await slaService.resumeTimer(req.params.timerId, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function complete(req, res) {
  const data = await slaService.completeTimer(req.params.timerId, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function escalate(req, res) {
  const data = await escalationService.escalateEntity(
    req.body.entityType || 'task',
    req.body.entityId || req.params.timerId,
    req.body.reason || 'manual_escalation',
    contextFromRequest(req)
  );
  return res.json({ success: true, data, error: null });
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
