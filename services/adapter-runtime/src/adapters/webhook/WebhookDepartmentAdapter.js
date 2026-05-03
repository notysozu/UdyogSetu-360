const { BaseDepartmentAdapter } = require('../base/BaseDepartmentAdapter');
const {
  verifyWebhookHeaders,
  verifyHmacSignature
} = require('../../signatures/signature-validator');
const { AdapterSignatureError } = require('../../errors/adapter.errors');

class WebhookDepartmentAdapter extends BaseDepartmentAdapter {
  validateSignature(payload, headers = {}, context = {}) {
    if (!this.config.signature?.secretRefValue && !this.config.webhook?.signatureSecretRefValue) {
      return true;
    }
    const secret = this.config.signature?.secretRefValue || this.config.webhook?.signatureSecretRefValue;
    const details = verifyWebhookHeaders(headers, {
      headerName: this.config.signature?.headerName,
      timestampHeaderName: this.config.signature?.timestampHeaderName,
      toleranceSeconds: this.config.signature?.toleranceSeconds
    });
    const valid = verifyHmacSignature(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      details.signature,
      secret,
      { algorithm: this.config.signature?.algorithm || 'hmac-sha256' }
    );
    if (!valid) {
      throw new AdapterSignatureError('Invalid webhook signature.', {
        details: { correlationId: context.correlationId }
      });
    }
    return true;
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || null,
      status: {
        externalStatus: callbackPayload.status || 'received',
        canonicalStatus: callbackPayload.status || 'received',
        statusMessage: 'Webhook callback received'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { WebhookDepartmentAdapter };
