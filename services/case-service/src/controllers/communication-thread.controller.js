const threadService = require('../services/communication-thread.service');
const { validateThreadMessage } = require('../validators/communication.validators');

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

async function createThread(req, res, next) {
  try {
    const data = await threadService.createThread(req.body || {}, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function addMessage(req, res, next) {
  try {
    const errors = validateThreadMessage(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
    const data = await threadService.addMessage(req.params.threadId, req.body || {}, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function listMessages(req, res, next) {
  try {
    const user = {
      role: req.get('x-user-role') || null,
      primaryRole: req.get('x-user-role') || null
    };
    const data = await threadService.listThreadMessages(req.params.threadId, user, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function closeThread(req, res, next) {
  try {
    const data = await threadService.closeThread(req.params.threadId, req.body?.reason, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createThread,
  addMessage,
  listMessages,
  closeThread
};
