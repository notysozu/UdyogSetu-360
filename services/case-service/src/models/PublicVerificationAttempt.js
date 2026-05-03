const mongoose = require('mongoose');

const PublicVerificationAttemptSchema = new mongoose.Schema(
  {
    verificationId: { type: String, required: true, trim: true },
    inputHash: { type: String, trim: true },
    lookupType: {
      type: String,
      enum: ['verification_token', 'certificate_case', 'certificate_checksum', 'reference_case', 'reference_checksum', 'unknown'],
      default: 'unknown',
      index: true
    },
    certificateNumberHash: { type: String, trim: true },
    universalCaseId: { type: String, trim: true, index: true },
    verificationTokenHash: { type: String, trim: true },
    ipAddressHash: { type: String, trim: true, index: true },
    userAgentHash: { type: String, trim: true },
    success: { type: Boolean, default: false, index: true },
    resultStatus: { type: String, trim: true, index: true },
    failureReason: { type: String, trim: true },
    correlationId: { type: String, trim: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PublicVerificationAttemptSchema.index({ verificationId: 1 }, { unique: true });
PublicVerificationAttemptSchema.index({ createdAt: 1 });
PublicVerificationAttemptSchema.index({ success: 1, createdAt: -1 });
PublicVerificationAttemptSchema.index({ resultStatus: 1, createdAt: -1 });
PublicVerificationAttemptSchema.index({ ipAddressHash: 1, createdAt: -1 });

module.exports =
  mongoose.models.PublicVerificationAttempt ||
  mongoose.model('PublicVerificationAttempt', PublicVerificationAttemptSchema);
