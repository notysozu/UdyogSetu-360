const mongoose = require('mongoose');
const { createOperationalSchema } = require('../../../../packages/shared/src');

const DigiLockerConsentSchema = createOperationalSchema({
  consentId: { type: String, required: true, trim: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  requestedDocumentTypes: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['initiated', 'granted', 'denied', 'expired', 'revoked', 'failed'],
    default: 'initiated',
    index: true
  },
  purpose: { type: String, required: true, trim: true },
  redirectUrl: { type: String, trim: true },
  state: { type: String, trim: true, index: true },
  nonce: { type: String, trim: true },
  expiresAt: { type: Date, index: true },
  grantedAt: Date,
  revokedAt: Date,
  digilockerAuthCode: { type: String, trim: true },
  tokenRef: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  correlationId: { type: String, trim: true }
});

DigiLockerConsentSchema.index(
  { consentId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
DigiLockerConsentSchema.index({ userId: 1, createdAt: -1 });
DigiLockerConsentSchema.index({ caseId: 1, status: 1 });
DigiLockerConsentSchema.index(
  { state: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false, state: { $type: 'string' } } }
);

module.exports =
  mongoose.models.DigiLockerConsent || mongoose.model('DigiLockerConsent', DigiLockerConsentSchema);
