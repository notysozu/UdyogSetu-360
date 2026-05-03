const mongoose = require('mongoose');
const { createOperationalSchema } = require('../../../../packages/shared/src');

const DigiLockerReconciliationLogSchema = createOperationalSchema({
  reconciliationId: { type: String, required: true, trim: true, index: true },
  consentId: { type: String, trim: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  documentType: { type: String, trim: true, index: true },
  digilockerDocumentId: { type: String, trim: true, index: true, sparse: true },
  operation: {
    type: String,
    enum: [
      'consent_initiated',
      'consent_callback_received',
      'document_list_requested',
      'document_retrieved',
      'document_verified',
      'document_imported',
      'verification_failed',
      'webhook_received'
    ],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'skipped'],
    default: 'pending',
    index: true
  },
  requestPayloadHash: { type: String, trim: true },
  responsePayloadHash: { type: String, trim: true },
  externalReference: { type: String, trim: true, index: true, sparse: true },
  errorCode: { type: String, trim: true },
  errorMessage: { type: String, trim: true },
  correlationId: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

DigiLockerReconciliationLogSchema.index(
  { reconciliationId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
DigiLockerReconciliationLogSchema.index({ consentId: 1, createdAt: -1 });
DigiLockerReconciliationLogSchema.index({ caseId: 1, documentType: 1 });
DigiLockerReconciliationLogSchema.index({ operation: 1, status: 1 });

module.exports =
  mongoose.models.DigiLockerReconciliationLog ||
  mongoose.model('DigiLockerReconciliationLog', DigiLockerReconciliationLogSchema);
