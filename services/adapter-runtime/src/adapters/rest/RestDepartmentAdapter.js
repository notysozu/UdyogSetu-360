const {
  AdapterAuthenticationError,
  AdapterBadRequestError,
  AdapterConflictError,
  AdapterNotFoundError,
  AdapterRateLimitError,
  AdapterTimeoutError,
  AdapterUnavailableError
} = require('../../errors/adapter.errors');
const { buildSignatureHeaders } = require('../../signatures/signature-validator');
const { BaseDepartmentAdapter } = require('../base/BaseDepartmentAdapter');

class RestDepartmentAdapter extends BaseDepartmentAdapter {
  validateConfig() {
    super.validateConfig();
    if (!this.config.baseUrl && !this.config.metadata?.mock) {
      throw new AdapterBadRequestError('baseUrl is required for REST adapters.');
    }
    return true;
  }

  buildHeaders(payload, context = {}) {
    const headers = {
      'content-type': 'application/json',
      'x-correlation-id': context.correlationId || ''
    };
    if (this.config.auth?.type === 'api_key' && this.config.auth?.headerName && this.config.auth?.secretRefValue) {
      headers[this.config.auth.headerName] = this.config.auth.secretRefValue;
    }
    if (this.config.signature?.secretRefValue) {
      Object.assign(
        headers,
        buildSignatureHeaders(payload, {
          secret: this.config.signature.secretRefValue,
          algorithm: this.config.signature.algorithm,
          correlationId: context.correlationId
        })
      );
    }
    return headers;
  }

  async request(operation, url, payload, context = {}) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutMs = Number(this.config.timeoutMs || 15000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: payload ? 'POST' : 'GET',
        headers: this.buildHeaders(payload, context),
        body: payload ? JSON.stringify(payload) : undefined,
        signal: controller.signal
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (_error) {
        data = { raw: text };
      }

      if (!response.ok) {
        if (response.status === 400 || response.status === 422) throw new AdapterBadRequestError('Department rejected request.', { statusCode: response.status, details: data });
        if (response.status === 401) throw new AdapterAuthenticationError('Department authentication failed.', { statusCode: response.status, details: data });
        if (response.status === 404) throw new AdapterNotFoundError('Department endpoint not found.', { statusCode: response.status, details: data });
        if (response.status === 409) throw new AdapterConflictError('Department reported conflict.', { statusCode: response.status, details: data });
        if (response.status === 429) throw new AdapterRateLimitError('Department rate limit exceeded.', { statusCode: response.status, details: data });
        throw new AdapterUnavailableError('Department service unavailable.', { statusCode: response.status, details: data });
      }

      return this.buildResult(operation, {
        rawResponse: data,
        correlationId: context.correlationId,
        durationMs: Date.now() - startedAt
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new AdapterTimeoutError('Department endpoint timed out.');
      }
      throw this.normaliseError(error, context);
    } finally {
      clearTimeout(timer);
    }
  }

  async submitApplication(canonicalPayload, context = {}) {
    const payload = this.transformOutboundPayload(canonicalPayload, context);
    const response = await this.request('submit_application', `${this.config.baseUrl}${this.config.endpoints?.submitApplication || ''}`, payload, context);
    return this.normaliseResponse(response.rawResponse, {
      ...context,
      operation: 'submit_application',
      durationMs: response.metadata.durationMs
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    const path = `${this.config.baseUrl}${this.config.endpoints?.getStatus || ''}`.replace(':externalReferenceId', externalReferenceId);
    const response = await this.request('status_check', path, null, context);
    return this.normaliseResponse(response.rawResponse, {
      ...context,
      operation: 'status_check',
      durationMs: response.metadata.durationMs
    });
  }

  async pushDocument(documentPayload, context = {}) {
    const response = await this.request('document_push', `${this.config.baseUrl}${this.config.endpoints?.pushDocument || ''}`, documentPayload, context);
    return this.normaliseResponse(response.rawResponse, {
      ...context,
      operation: 'document_push',
      durationMs: response.metadata.durationMs
    });
  }
}

module.exports = { RestDepartmentAdapter };
