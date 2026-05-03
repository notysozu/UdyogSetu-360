const { AdapterError } = require('../errors/adapter.errors');

const DEFAULT_RETRY_POLICY = Object.freeze({
  maxAttempts: 5,
  baseDelayMs: 5000,
  maxDelayMs: 300000,
  backoffMultiplier: 2,
  jitterEnabled: true,
  retryableErrorCodes: ['DEPARTMENT_TIMEOUT', 'ADAPTER_UNAVAILABLE', 'ADAPTER_RATE_LIMITED'],
  nonRetryableErrorCodes: ['ADAPTER_BAD_REQUEST', 'ADAPTER_AUTHENTICATION_ERROR', 'ADAPTER_AUTHORISATION_ERROR'],
  retryableHttpStatuses: [408, 429, 500, 502, 503, 504],
  nonRetryableHttpStatuses: [400, 401, 403, 404, 409, 422]
});

function getRetryPolicy(_departmentCode, _operation, override = {}) {
  return {
    ...DEFAULT_RETRY_POLICY,
    ...(override || {})
  };
}

function shouldRetryAdapterError(error, context = {}) {
  const policy = getRetryPolicy(context.departmentCode, context.operation, context.retryPolicy);
  if (error instanceof AdapterError) {
    if (policy.nonRetryableErrorCodes.includes(error.code)) return false;
    if (policy.retryableErrorCodes.includes(error.code)) return true;
    return Boolean(error.retryable);
  }
  return false;
}

function calculateAdapterRetryDelay(attempt, policy = DEFAULT_RETRY_POLICY) {
  const jitter = policy.jitterEnabled ? Math.floor(Math.random() * 1000) : 0;
  return Math.min(
    policy.baseDelayMs * policy.backoffMultiplier ** Math.max(0, attempt) + jitter,
    policy.maxDelayMs
  );
}

function classifyRetryDecision(error, context = {}) {
  const retry = shouldRetryAdapterError(error, context);
  return {
    retry,
    classification: retry ? 'retryable' : 'non_retryable',
    delayMs: retry ? calculateAdapterRetryDelay(context.attempt || 0, getRetryPolicy(context.departmentCode, context.operation, context.retryPolicy)) : 0
  };
}

module.exports = {
  DEFAULT_RETRY_POLICY,
  getRetryPolicy,
  shouldRetryAdapterError,
  calculateAdapterRetryDelay,
  classifyRetryDecision
};
