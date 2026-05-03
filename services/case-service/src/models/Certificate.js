const mongoose = require('mongoose');
const {
  createOperationalSchema,
  CERTIFICATE_STATUS_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

const CertificateSchema = createOperationalSchema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, required: true, index: true },
  certificateType: { type: String, required: true, trim: true },
  certificateNumber: { type: String, trim: true },
  verificationToken: { type: String, trim: true },
  checksum: { type: String, trim: true },
  status: { type: String, enum: CERTIFICATE_STATUS_VALUES, default: 'draft', index: true },
  issuedToOrganisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issuedAt: Date,
  validFrom: Date,
  validUntil: { type: Date, index: true },
  revokedAt: Date,
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  revokeReason: String,
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }
});

CertificateSchema.index(
  { certificateNumber: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } }
);
CertificateSchema.index(
  { verificationToken: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } }
);
CertificateSchema.index({ departmentCode: 1, status: 1 });

CertificateSchema.pre('validate', function validateCertificate(next) {
  if (this.status === 'issued') {
    if (!this.certificateNumber || !this.issuedAt || !this.verificationToken) {
      return next(new Error('Issued certificates require certificateNumber, issuedAt, and verificationToken.'));
    }
  }
  return next();
});

module.exports = mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);
