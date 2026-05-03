const crypto = require('crypto');
const { getGatewayConfig } = require('../config/gateway.config');

function computeSignature(secret, rawBody, timestamp) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${rawBody}${timestamp}`)
    .digest('hex');
}

function verifySignature({ secret, rawBody, timestamp, providedSignature }) {
  const expected = computeSignature(secret, rawBody, timestamp);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(providedSignature || '');
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function withinTolerance(timestamp) {
  const config = getGatewayConfig();
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.abs(nowSeconds - Number(timestamp)) <= config.webhookToleranceSeconds;
}

module.exports = { computeSignature, verifySignature, withinTolerance };
