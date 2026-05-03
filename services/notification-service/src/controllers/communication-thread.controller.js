const communicationThreadService = require('../../../case-service/src/services/communication-thread.service');
const validators = require('../validators/communication.validators');

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

async function createThread(req, res) {
  const errors = validators.validateThreadCreate(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
  const data = await communicationThreadService.createThread(req.body || {}, contextFromRequest(req));
  return res.status(201).json({ success: true, data, error: null });
}

async function addMessage(req, res) {
  const errors = validators.validateMessage(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, data: null, error: { message: errors[0] } });
  const data = await communicationThreadService.addMessage(req.params.threadId, req.body || {}, contextFromRequest(req));
  return res.status(201).json({ success: true, data, error: null });
}

async function listMessages(req, res) {
  const user = { id: req.get('x-user-id') || null, role: req.get('x-user-role') || null, primaryRole: req.get('x-user-role') || null };
  const data = await communicationThreadService.listThreadMessages(req.params.threadId, user, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

async function closeThread(req, res) {
  const data = await communicationThreadService.closeThread(req.params.threadId, req.body?.reason, contextFromRequest(req));
  return res.json({ success: true, data, error: null });
}

module.exports = {
  createThread,
  addMessage,
  listMessages,
  closeThread
};
