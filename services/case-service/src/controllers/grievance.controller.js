const grievanceService = require('../services/grievance.service');
const { validateGrievanceCreate, validateMessageInput, validateStatusChange } = require('../validators/grievance.validators');

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

async function create(req, res, next) {
  try {
    const errors = validateGrievanceCreate(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
    const data = await grievanceService.createGrievance(req.body, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const data = await grievanceService.listGrievances(userFromRequest(req), req.query || {}, {
      page: req.query.page || 1,
      limit: req.query.limit || 25
    }, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const data = await grievanceService.getGrievanceDetail(userFromRequest(req), req.params.grievanceId);
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function addMessage(req, res, next) {
  try {
    const errors = validateMessageInput(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
    const data = await grievanceService.addMessage(req.params.grievanceId, req.body, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function addInternalComment(req, res, next) {
  try {
    const errors = validateMessageInput(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
    const data = await grievanceService.addInternalComment(req.params.grievanceId, req.body, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function addExternalReply(req, res, next) {
  try {
    const errors = validateMessageInput(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
    const data = await grievanceService.addExternalReply(req.params.grievanceId, req.body, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function patchStatus(req, res, next) {
  try {
    const errors = validateStatusChange(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
    const data = await grievanceService.changeStatus(req.params.grievanceId, req.body.nextStatus, req.body.reason, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function acknowledge(req, res, next) {
  try {
    const data = await grievanceService.acknowledgeGrievance(req.params.grievanceId, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function assign(req, res, next) {
  try {
    const data = await grievanceService.assignGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function resolve(req, res, next) {
  try {
    const data = await grievanceService.resolveGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function close(req, res, next) {
  try {
    const data = await grievanceService.closeGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function reopen(req, res, next) {
  try {
    const data = await grievanceService.reopenGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function escalate(req, res, next) {
  try {
    const data = await grievanceService.escalateGrievance(req.params.grievanceId, req.body || {}, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
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
