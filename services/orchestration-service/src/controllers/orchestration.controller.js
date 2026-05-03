const orchestrationService = require('../services/orchestration.service');
const slaService = require('../services/sla-orchestration.service');
const caseRepository = require('../repositories/case.repository');
const taskRepository = require('../repositories/task.repository');
const validators = require('../validators/orchestration.validators');

function getContext(req) {
  return {
    actor: req.user,
    user: req.user,
    correlationId: req.headers['x-correlation-id'] || null,
    requestId: req.headers['x-request-id'] || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  };
}

function sendSuccess(res, data, context = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    meta: {
      correlationId: context.correlationId || null,
      requestId: context.requestId || null,
      timestamp: new Date().toISOString(),
      apiVersion: 'v1'
    }
  });
}

function sendError(res, error, context = {}, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details || null
    },
    meta: {
      correlationId: context.correlationId || null,
      requestId: context.requestId || null,
      timestamp: new Date().toISOString(),
      apiVersion: 'v1'
    }
  });
}

async function transitionCase(req, res) {
  const context = getContext(req);
  try {
    const parsed = validators.transitionCaseSchema(req.body);
    const caseDoc = await orchestrationService.transitionCase(
      req.params.caseId,
      parsed.nextStatus,
      { ...parsed.payload, reason: parsed.reason || parsed.overrideReason },
      { ...context, override: parsed.override, overrideReason: parsed.overrideReason, reason: parsed.reason }
    );
    sendSuccess(res, { case: caseDoc }, context);
  } catch (error) {
    sendError(res, error, context, error.statusCode || 500);
  }
}

async function transitionTask(req, res) {
  const context = getContext(req);
  try {
    const parsed = validators.transitionTaskSchema(req.body);
    const taskDoc = await orchestrationService.transitionTask(
      req.params.taskId,
      parsed.nextStatus,
      { ...parsed.payload, reason: parsed.reason || parsed.overrideReason },
      { ...context, override: parsed.override, overrideReason: parsed.overrideReason, reason: parsed.reason }
    );
    sendSuccess(res, { task: taskDoc }, context);
  } catch (error) {
    sendError(res, error, context, error.statusCode || 500);
  }
}

async function recalculateCase(req, res) {
  const context = getContext(req);
  try {
    validators.recalculateCaseSchema(req.body);
    const result = await orchestrationService.recalculateCaseAggregateStatus(
      req.params.caseId,
      context
    );
    sendSuccess(res, result, context);
  } catch (error) {
    sendError(res, error, context, error.statusCode || 500);
  }
}

async function replayCase(req, res) {
  const context = getContext(req);
  try {
    validators.replayCaseSchema(req.body);
    const result = await orchestrationService.replayEventsForCase(req.params.caseId, context);
    sendSuccess(res, result, context);
  } catch (error) {
    sendError(res, error, context, error.statusCode || 500);
  }
}

async function getCaseState(req, res) {
  const context = getContext(req);
  try {
    const caseDoc = await caseRepository.findLeanById(req.params.caseId);
    if (!caseDoc) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Case not found.' }, context, 404);
    }
    const tasks = await taskRepository.findByCaseId(caseDoc._id);
    return sendSuccess(res, { case: caseDoc, tasks }, context);
  } catch (error) {
    return sendError(res, error, context, error.statusCode || 500);
  }
}

async function getTaskState(req, res) {
  const context = getContext(req);
  try {
    const taskDoc = await taskRepository.findById(req.params.taskId);
    if (!taskDoc) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Task not found.' }, context, 404);
    }
    return sendSuccess(res, { task: taskDoc }, context);
  } catch (error) {
    return sendError(res, error, context, error.statusCode || 500);
  }
}

async function evaluateSla(req, res) {
  const context = getContext(req);
  try {
    const parsed = validators.evaluateSlaSchema(req.body);
    const result = await slaService.evaluateSlaTimers(parsed.now, context);
    sendSuccess(res, result, context);
  } catch (error) {
    sendError(res, error, context, error.statusCode || 500);
  }
}

module.exports = {
  transitionCase,
  transitionTask,
  recalculateCase,
  replayCase,
  getCaseState,
  getTaskState,
  evaluateSla
};
