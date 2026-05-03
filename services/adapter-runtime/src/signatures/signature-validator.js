const crypto = require('crypto');
const { AdapterSignatureError } = require('../errors/adapter.errors');

function canonicalizePayload(payload) {
  return typeof payload === 'string' ? payload : JSON.stringify(payload);
}

function signPayload(payload, secret, options = {}) {
  const algorithm = String(options.algorithm || 'hmac-sha256').toLowerCase();
  const body = canonicalizePayload(payload);
  if (algorithm === 'hmac-sha512') {
    return crypto.createHmac('sha512', secret).update(body).digest('hex');
  }
  if (algorithm === 'rsa-sha256') {
    return 'rsa-sha256-placeholder';
  }
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function verifyHmacSignature(rawBody, signature, secret, options = {}) {
  const expected = signPayload(rawBody, secret, options);
  const provided = String(signature || '').replace(/^sha(256|512)=/i, '');
  if (expected.length !== provided.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function verifyTimestamp(timestamp, toleranceSeconds = 300) {
  if (!timestamp) {
    throw new AdapterSignatureError('Missing webhook timestamp.');
  }
  const ageSeconds = Math.abs(Date.now() - new Date(timestamp).getTime()) / 1000;
  if (ageSeconds > toleranceSeconds) {
    throw new AdapterSignatureError('Webhook timestamp expired.', {
      code: 'WEBHOOK_TIMESTAMP_EXPIRED',
      details: { ageSeconds, toleranceSeconds }
    });
  }
  return true;
}

function verifyWebhookHeaders(headers = {}, config = {}) {
  const signatureHeader = config.headerName || 'x-us360-signature';
  const timestampHeader = config.timestampHeaderName || 'x-us360-timestamp';
  const apiKeyHeader = config.apiKeyHeaderName || 'x-api-key';
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), value])
  );

  if (config.authType === 'api_key' && config.expectedApiKey) {
    if (normalizedHeaders[apiKeyHeader.toLowerCase()] !== config.expectedApiKey) {
      throw new AdapterSignatureError('Invalid API key header.', { code: 'API_KEY_INVALID' });
    }
  }

  verifyTimestamp(normalizedHeaders[timestampHeader.toLowerCase()], config.toleranceSeconds || 300);
  return {
    signature: normalizedHeaders[signatureHeader.toLowerCase()],
    timestamp: normalizedHeaders[timestampHeader.toLowerCase()],
    webhookId: normalizedHeaders['x-us360-webhook-id'] || null
  };
}

function buildSignatureHeaders(payload, config = {}) {
  const timestamp = new Date().toISOString();
  const signature = config.secret
    ? signPayload(payload, config.secret, { algorithm: config.algorithm })
    : null;
  return {
    'x-us360-signature': signature,
    'x-us360-timestamp': timestamp,
    'x-correlation-id': config.correlationId || null
  };
}

function maskSignatureHeaders(headers = {}) {
  const masked = { ...headers };
  if (masked['x-us360-signature']) {
    masked['x-us360-signature'] = '***';
  }
  if (masked.authorization) {
    masked.authorization = '***';
  }
  return masked;
}

module.exports = {
  signPayload,
  verifyHmacSignature,
  verifyTimestamp,
  verifyWebhookHeaders,
  buildSignatureHeaders,
  maskSignatureHeaders
};
