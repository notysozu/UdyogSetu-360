const { createLogger } = require('../../../../../packages/shared/src/logger');
const {
  AdapterMethodNotImplementedError,
  AdapterValidationError,
  classifyAdapterError
} = require('../../errors/adapter.errors');

class BaseDepartmentAdapter {
  constructor(config = {}) {
    this.adapterCode = config.adapterCode;
    this.departmentCode = config.departmentCode;
    this.adapterType = config.adapterType;
    this.displayName = config.displayName || config.adapterCode || config.departmentCode;
    this.config = config;
    this.logger = config.logger || createLogger(`adapter-${this.departmentCode || 'unknown'}`);
    this.retryPolicy = config.retryPolicy || {};
    this.capabilities = config.capabilities || [];
  }

  log(level, message, context = {}) {
    const loggerMethod = this.logger[level] || this.logger.info.bind(this.logger);
    loggerMethod(message, {
      adapterCode: this.adapterCode,
      departmentCode: this.departmentCode,
      correlationId: context.correlationId || null,
      ...context
    });
  }

  supports(capability) {
    return this.capabilities.includes(capability);
  }

  async initialise() {
    return this;
  }

  validateConfig() {
    if (!this.departmentCode) {
      throw new AdapterValidationError('departmentCode is required.');
    }
    if (!this.adapterCode) {
      throw new AdapterValidationError('adapterCode is required.');
    }
    return true;
  }

  async healthCheck(_context = {}) {
    return this.buildResult('health_check', {
      status: {
        externalStatus: 'ok',
        canonicalStatus: 'ok',
        statusMessage: 'Adapter reachable'
      },
      rawResponse: {
        ok: true
      }
    });
  }

  async submitApplication(_canonicalPayload, _context = {}) {
    throw new AdapterMethodNotImplementedError(`submitApplication is not implemented for ${this.adapterCode}`);
  }

  async getStatus(_externalReferenceId, _context = {}) {
    throw new AdapterMethodNotImplementedError(`getStatus is not implemented for ${this.adapterCode}`);
  }

  async pushDocument(_documentPayload, _context = {}) {
    throw new AdapterMethodNotImplementedError(`pushDocument is not implemented for ${this.adapterCode}`);
  }

  async receiveCallback(_callbackPayload, _context = {}) {
    throw new AdapterMethodNotImplementedError(`receiveCallback is not implemented for ${this.adapterCode}`);
  }

  normaliseResponse(rawResponse, _context = {}) {
    return rawResponse;
  }

  normaliseError(error, context = {}) {
    return classifyAdapterError(error, null, context);
  }

  buildAcknowledgement(rawResponse, context = {}) {
    return {
      acknowledgementNumber: rawResponse?.ackNo || rawResponse?.acknowledgementNumber || null,
      acknowledgedAt: new Date().toISOString(),
      message: rawResponse?.message || context.message || 'Acknowledged by department'
    };
  }

  validateSignature(_payload, _headers = {}, _context = {}) {
    return true;
  }

  transformOutboundPayload(canonicalPayload, _context = {}) {
    return canonicalPayload;
  }

  transformInboundPayload(externalPayload, _context = {}) {
    return externalPayload;
  }

  buildResult(operation, input = {}) {
    return {
      success: input.success !== undefined ? input.success : true,
      departmentCode: this.departmentCode,
      adapterCode: this.adapterCode,
      operation,
      externalReferenceId: input.externalReferenceId || null,
      acknowledgement: input.acknowledgement || null,
      status: input.status || null,
      rawResponse: input.rawResponse || {},
      metadata: {
        correlationId: input.correlationId || null,
        durationMs: input.durationMs || 0,
        ...(input.metadata || {})
      }
    };
  }

  buildFailure(operation, error, input = {}) {
    const normalized = this.normaliseError(error, input.context || {});
    return {
      success: false,
      departmentCode: this.departmentCode,
      adapterCode: this.adapterCode,
      operation,
      error: {
        code: normalized.code,
        message: normalized.message,
        classification: normalized.classification,
        externalCode: normalized.externalCode,
        details: normalized.details || {}
      },
      metadata: {
        correlationId: input.correlationId || null,
        durationMs: input.durationMs || 0
      }
    };
  }

  async close() {
    return true;
  }
}

module.exports = { BaseDepartmentAdapter };
