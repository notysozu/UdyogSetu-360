const mongoose = require('mongoose');
const { createOperationalSchema } = require('../../../../packages/shared/src');

const DocumentAccessLogSchema = createOperationalSchema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  actorRole: { type: String, trim: true },
  action: { type: String, trim: true, required: true, index: true },
  accessType: { type: String, trim: true },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true },
  success: { type: Boolean, default: true },
  failureReason: { type: String, trim: true },
  correlationId: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

DocumentAccessLogSchema.index({ documentId: 1, createdAt: -1 });
DocumentAccessLogSchema.index({ actorUserId: 1, createdAt: -1 });
DocumentAccessLogSchema.index({ universalCaseId: 1, createdAt: -1 });
DocumentAccessLogSchema.index({ action: 1, createdAt: -1 });

module.exports =
  mongoose.models.DocumentAccessLog || mongoose.model('DocumentAccessLog', DocumentAccessLogSchema);
