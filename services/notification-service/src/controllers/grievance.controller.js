const grievanceService = require('../../../case-service/src/services/grievance.service');
const validators = require('../validators/grievance.validators');

function contextFromRequest(req) {
  return {
    userId: req.get('x-user-id') || null,
    role: req.get('x-user-role') || null,
    departmentCode: req.get('x-department-code') || null,
    correlationId: req.correlationId || null,
    requestId: req.requestId || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
    user: { actorType: 'user', actorId: req.get('x-user-id') || null, role: req.get('x-user-role') || null }
  };
}

function userFromRequest(req) {
  return {
    id: req.get('x-user-id') || null,
    _id: req.get('x-user-id') || null,
    role: req.get('x-user-role') || null,
    primaryRole: req.get('x-user-role') || null,
    organisationId: req.get('x-organisation-id') || null,
    departmentCode: req.get('x-department-code') || null
  };
}

async function create(req, res) {
  const errors = validators.validateGrievanceCreate(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
  const data = await grievanceService.createGrievance(req.body || {}, contextFromRequest(req));
  return res.status(201).json({ success: true, data, error: null });
}

async function list(req, res) {
  const data = await grievanceService.listGrievances(userFromRequest(req), req.query || {}, {
    page: req.query.page || 1,
    limit: req.query.limit || 25
  }, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function get(req, res) {
  const data = await grievanceService.getGrievanceDetail(userFromRequest(req), req.params.grievanceId, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function addMessage(req, res) {
  const errors = validators.validateMessageInput(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
  const data = await grievanceService.addMessage(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.status(201).json({ success: true, data, error: null });
}

async function addInternalComment(req, res) {
  const errors = validators.validateMessageInput(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
  const data = await grievanceService.addInternalComment(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.status(201).json({ success: true, data, error: null });
}

async function addExternalReply(req, res) {
  const errors = validators.validateMessageInput(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
  const data = await grievanceService.addExternalReply(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.status(201).json({ success: true, data, error: null });
}

async function patchStatus(req, res) {
  const errors = validators.validateStatusChange(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
  const data = await grievanceService.changeStatus(req.params.grievanceId, req.body.nextStatus, req.body.reason, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function acknowledge(req, res) {
  const data = await grievanceService.acknowledgeGrievance(req.params.grievanceId, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function assign(req, res) {
  const data = await grievanceService.assignGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function resolve(req, res) {
  const data = await grievanceService.resolveGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function close(req, res) {
  const data = await grievanceService.closeGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function reopen(req, res) {
  const data = await grievanceService.reopenGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function escalate(req, res) {
  const data = await grievanceService.escalateGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

module.exports = {
  create,
  list,
  get,
  addMessage,
  addInternalComment,
  addExternalReply,
  patchStatus,
  acknowledge,
  assign,
  resolve,
  close,
  reopen,
  escalate
};
