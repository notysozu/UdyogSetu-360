const { AppError, CASE_STATUS_VALUES, TASK_STATUS_VALUES } = require('../../../../packages/shared/src');

function ensureObject(value, fieldName) {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an object.`, 400);
  }
  return value;
}

function validateTransitionPayload(body = {}, allowedStatuses = []) {
  const payload = ensureObject(body, 'body');
  if (!payload.nextStatus || !allowedStatuses.includes(payload.nextStatus)) {
    throw new AppError('nextStatus is required and must be valid.', 400);
  }
  if (payload.override && !payload.overrideReason) {
    throw new AppError('overrideReason is required when override is true.', 400);
  }
  return {
    nextStatus: payload.nextStatus,
    reason: payload.reason || null,
    payload: ensureObject(payload.payload, 'payload'),
    override: Boolean(payload.override),
    overrideReason: payload.overrideReason || null
  };
}

function transitionCaseSchema(body = {}) {
  return validateTransitionPayload(body, CASE_STATUS_VALUES);
}

function transitionTaskSchema(body = {}) {
  return validateTransitionPayload(body, TASK_STATUS_VALUES);
}

function recalculateCaseSchema(body = {}) {
  const payload = ensureObject(body, 'body');
  return {
    reason: payload.reason || 'manual_recalculation'
  };
}

function replayCaseSchema(body = {}) {
  const payload = ensureObject(body, 'body');
  return {
    reason: payload.reason || 'manual_replay'
  };
}

function evaluateSlaSchema(body = {}) {
  const payload = ensureObject(body, 'body');
  return {
    now: payload.now ? new Date(payload.now) : new Date()
  };
}

module.exports = {
  transitionCaseSchema,
  transitionTaskSchema,
  recalculateCaseSchema,
  replayCaseSchema,
  evaluateSlaSchema
};
