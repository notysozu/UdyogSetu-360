const mongoose = require('mongoose');

const OperationalLogSchema = new mongoose.Schema(
  {
    level: { type: String, index: true },
    serviceName: { type: String, index: true },
    message: String,
    errorCode: String,
    errorMessage: String,
    correlationId: { type: String, index: true },
    requestId: String,
    traceId: { type: String, index: true },
    route: String,
    method: String,
    statusCode: Number,
    durationMs: Number,
    safeMetadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

OperationalLogSchema.index({ level: 1, createdAt: -1 });
OperationalLogSchema.index({ serviceName: 1, createdAt: -1 });
OperationalLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: Number(process.env.OPERATIONAL_LOG_RETENTION_DAYS || 30) * 86400 });

module.exports = mongoose.models.OperationalLog || mongoose.model('OperationalLog', OperationalLogSchema);
