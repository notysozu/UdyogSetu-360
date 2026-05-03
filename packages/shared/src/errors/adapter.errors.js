const { ADAPTER_ERROR_CLASSIFICATIONS } = require('../constants/adapter.constants');

class AdapterError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = details.code || 'ADAPTER_ERROR';
    this.classification = details.classification || ADAPTER_ERROR_CLASSIFICATIONS.UNKNOWN;
    this.externalCode = details.externalCode || null;
    this.details = details.details || {};
    this.retryable =
      details.retryable !== undefined
        ? Boolean(details.retryable)
        : this.classification === ADAPTER_ERROR_CLASSIFICATIONS.RETRYABLE ||
          this.classification === ADAPTER_ERROR_CLASSIFICATIONS.TIMEOUT ||
          this.classification === ADAPTER_ERROR_CLASSIFICATIONS.UNAVAILABLE ||
          this.classification === ADAPTER_ERROR_CLASSIFICATIONS.RATE_LIMITED;
    this.statusCode = details.statusCode || 500;
  }
}

class AdapterConfigError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_CONFIG_ERROR',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.CONFIGURATION,
      retryable: false,
      statusCode: details.statusCode || 500
    });
  }
}

class AdapterMethodNotImplementedError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_METHOD_NOT_IMPLEMENTED',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.NON_RETRYABLE,
      retryable: false,
      statusCode: 501
    });
  }
}

class AdapterValidationError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_VALIDATION_ERROR',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.VALIDATION,
      retryable: false,
      statusCode: 400
    });
  }
}

class AdapterMappingError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_MAPPING_ERROR',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.MAPPING,
      retryable: false,
      statusCode: 422
    });
  }
}

class AdapterSignatureError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_SIGNATURE_ERROR',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.AUTHENTICATION,
      retryable: false,
      statusCode: 401
    });
  }
}

class AdapterAuthenticationError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_AUTHENTICATION_ERROR',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.AUTHENTICATION,
      retryable: false,
      statusCode: 401
    });
  }
}

class AdapterAuthorisationError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_AUTHORISATION_ERROR',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.AUTHORISATION,
      retryable: false,
      statusCode: 403
    });
  }
}

class AdapterTimeoutError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'DEPARTMENT_TIMEOUT',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.TIMEOUT,
      retryable: true,
      statusCode: 504
    });
  }
}

class AdapterRateLimitError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_RATE_LIMITED',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.RATE_LIMITED,
      retryable: true,
      statusCode: 429
    });
  }
}

class AdapterUnavailableError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_UNAVAILABLE',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.UNAVAILABLE,
      retryable: true,
      statusCode: 503
    });
  }
}

class AdapterBadRequestError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_BAD_REQUEST',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.NON_RETRYABLE,
      retryable: false,
      statusCode: 400
    });
  }
}

class AdapterConflictError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_CONFLICT',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.CONFLICT,
      retryable: false,
      statusCode: 409
    });
  }
}

class AdapterNotFoundError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_NOT_FOUND',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.NON_RETRYABLE,
      retryable: false,
      statusCode: 404
    });
  }
}

class AdapterPermanentFailureError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_PERMANENT_FAILURE',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.NON_RETRYABLE,
      retryable: false,
      statusCode: 422
    });
  }
}

class AdapterRetryableFailureError extends AdapterError {
  constructor(message, details = {}) {
    super(message, {
      ...details,
      code: details.code || 'ADAPTER_RETRYABLE_FAILURE',
      classification: ADAPTER_ERROR_CLASSIFICATIONS.RETRYABLE,
      retryable: true,
      statusCode: 503
    });
  }
}

function classifyAdapterError(error, response = null, context = {}) {
  if (error instanceof AdapterError) {
    return error;
  }

  const status = response?.status || error?.status || error?.statusCode || 500;
  if (status === 400 || status === 422) {
    return new AdapterBadRequestError(error.message || 'Department rejected the request.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  if (status === 401) {
    return new AdapterAuthenticationError(error.message || 'Department authentication failed.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  if (status === 403) {
    return new AdapterAuthorisationError(error.message || 'Department authorisation failed.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  if (status === 404) {
    return new AdapterNotFoundError(error.message || 'Department resource not found.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  if (status === 408 || status === 504) {
    return new AdapterTimeoutError(error.message || 'Department endpoint timed out.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  if (status === 409) {
    return new AdapterConflictError(error.message || 'Department reported a conflicting request.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  if (status === 429) {
    return new AdapterRateLimitError(error.message || 'Department rate limit exceeded.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  if ([500, 502, 503].includes(status)) {
    return new AdapterUnavailableError(error.message || 'Department service unavailable.', {
      externalCode: response?.code || null,
      details: { response, context }
    });
  }
  return new AdapterError(error.message || 'Unexpected adapter error.', {
    code: error.code || 'ADAPTER_UNKNOWN_ERROR',
    classification: ADAPTER_ERROR_CLASSIFICATIONS.UNKNOWN,
    details: { response, context }
  });
}

module.exports = {
  AdapterError,
  AdapterConfigError,
  AdapterMethodNotImplementedError,
  AdapterValidationError,
  AdapterMappingError,
  AdapterSignatureError,
  AdapterAuthenticationError,
  AdapterAuthorisationError,
  AdapterTimeoutError,
  AdapterRateLimitError,
  AdapterUnavailableError,
  AdapterBadRequestError,
  AdapterConflictError,
  AdapterNotFoundError,
  AdapterPermanentFailureError,
  AdapterRetryableFailureError,
  classifyAdapterError
};
