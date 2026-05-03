const crypto = require('crypto');
const mongoose = require('mongoose');
const { getGatewayConfig } = require('../config/gateway.config');

const idempotencyRecordSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    method: { type: String, required: true },
    route: { type: String, required: true },
    requestHash: { type: String, required: true },
    responseStatus: Number,
    responseBody: { type: mongoose.Schema.Types.Mixed, default: null },
    actorId: { type: String, default: 'anonymous' },
    correlationId: String,
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'expired'],
      default: 'processing',
      index: true
    },
    lockedUntil: { type: Date, index: true },
    expiresAt: { type: Date }
  },
  { timestamps: true, minimize: false }
);

idempotencyRecordSchema.index(
  { key: 1, method: 1, route: 1, actorId: 1 },
  { unique: true }
);
idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
idempotencyRecordSchema.index({ status: 1, lockedUntil: 1 });

const IdempotencyRecord =
  mongoose.models.GatewayIdempotencyRecord ||
  mongoose.model('GatewayIdempotencyRecord', idempotencyRecordSchema);

function hashRequest(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex');
}

async function beginRecord({ key, method, route, body, actorId, correlationId }) {
  const config = getGatewayConfig();
  const requestHash = hashRequest(body);
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + config.idempotencyLockSeconds * 1000);
  const expiresAt = new Date(now.getTime() + config.idempotencyTtlSeconds * 1000);

  try {
    const record = await IdempotencyRecord.create({
      key,
      method,
      route,
      requestHash,
      actorId,
      correlationId,
      status: 'processing',
      lockedUntil,
      expiresAt
    });
    return { state: 'created', record };
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  const existing = await IdempotencyRecord.findOne({ key, method, route, actorId });
  if (!existing) {
    return { state: 'created_retry', record: null };
  }

  if (existing.requestHash !== requestHash) {
    return { state: 'conflict', record: existing };
  }

  if (existing.status === 'completed') {
    return { state: 'replayed', record: existing };
  }

  if (existing.status === 'processing' && existing.lockedUntil > now) {
    return { state: 'processing', record: existing };
  }

  existing.status = 'processing';
  existing.lockedUntil = lockedUntil;
  existing.correlationId = correlationId;
  await existing.save();
  return { state: 'created', record: existing };
}

async function completeRecord(recordId, responseStatus, responseBody) {
  return IdempotencyRecord.findByIdAndUpdate(
    recordId,
    {
      $set: {
        status: 'completed',
        responseStatus,
        responseBody
      }
    },
    { new: true }
  );
}

async function failRecord(recordId) {
  return IdempotencyRecord.findByIdAndUpdate(
    recordId,
    {
      $set: {
        status: 'failed'
      }
    },
    { new: true }
  );
}

module.exports = {
  IdempotencyRecord,
  beginRecord,
  completeRecord,
  failRecord,
  hashRequest
};
