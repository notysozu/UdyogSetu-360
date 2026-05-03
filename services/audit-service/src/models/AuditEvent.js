const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema(
  {
    actorType: { type: String, trim: true, default: 'user' },
    actorId: { type: String, trim: true, index: true },
    role: { type: String, trim: true },
    displayName: { type: String, trim: true },
    serviceName: { type: String, trim: true }
  },
  { _id: false }
);

const outcomeSchema = new mongoose.Schema(
  {
    success: { type: Boolean, default: true },
    failure: { type: Boolean, default: false },
    denied: { type: Boolean, default: false }
  },
  { _id: false }
);

// Legal audit records: append-only and tamper-evident.
const AuditEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    auditSequence: { type: Number, required: true, unique: true, index: true },
    actor: { type: actorSchema, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, required: true, index: true },
    caseId: { type: String, trim: true, index: true },
    universalCaseId: { type: String, trim: true, index: true },
    taskId: { type: String, trim: true, index: true },
    grievanceId: { type: String, trim: true, index: true },
    departmentCode: { type: String, trim: true, index: true },
    correlationId: { type: String, trim: true, index: true },
    requestId: { type: String, trim: true },
    traceId: { type: String, trim: true, index: true },
    ipAddressHash: { type: String, trim: true },
    userAgentHash: { type: String, trim: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, trim: true },
    outcome: { type: outcomeSchema, default: () => ({ success: true }) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    previousHash: { type: String, trim: true, default: null },
    currentHash: { type: String, trim: true, required: true },
    hashAlgorithm: { type: String, trim: true, default: 'sha256' }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    minimize: false
  }
);

AuditEventSchema.index({ 'actor.actorId': 1, createdAt: -1 });
AuditEventSchema.index({ action: 1, createdAt: -1 });
AuditEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AuditEventSchema.index({ universalCaseId: 1, createdAt: -1 });
AuditEventSchema.index({ caseId: 1, createdAt: -1 });
AuditEventSchema.index({ taskId: 1, createdAt: -1 });
AuditEventSchema.index({ grievanceId: 1, createdAt: -1 });
AuditEventSchema.index({ departmentCode: 1, createdAt: -1 });
AuditEventSchema.index({ correlationId: 1 });
AuditEventSchema.index({ traceId: 1 });
AuditEventSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AuditServiceEvent || mongoose.model('AuditServiceEvent', AuditEventSchema);
