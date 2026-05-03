const mongoose = require('mongoose');
const {
  createOperationalSchema,
  DOCUMENT_STATUS_VALUES,
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_VISIBILITY_VALUES,
  DOCUMENT_STORAGE_PROVIDER_VALUES,
  DOCUMENT_VERIFICATION_STATUS_VALUES,
  DOCUMENT_SCAN_STATUS_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

const storageSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: DOCUMENT_STORAGE_PROVIDER_VALUES, required: true },
    bucket: { type: String, trim: true },
    objectKey: { type: String, trim: true },
    region: { type: String, trim: true },
    endpointRef: { type: String, trim: true },
    signedUrlExpiresAt: Date
  },
  { _id: false }
);

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, trim: true },
    storedName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    extension: { type: String, trim: true },
    sizeBytes: { type: Number, min: 1 },
    encoding: { type: String, trim: true }
  },
  { _id: false }
);

const hashSchema = new mongoose.Schema(
  {
    algorithm: { type: String, trim: true, default: 'sha256' },
    checksum: { type: String, trim: true },
    computedAt: Date
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: DOCUMENT_VERIFICATION_STATUS_VALUES,
      default: 'not_required'
    },
    method: { type: String, trim: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    confidence: { type: Number, min: 0, max: 1 },
    remarks: { type: String, trim: true },
    failureReason: { type: String, trim: true }
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    status: { type: String, enum: DOCUMENT_SCAN_STATUS_VALUES, default: 'not_scanned' },
    provider: { type: String, trim: true, default: 'stub' },
    scannedAt: Date,
    result: { type: String, trim: true },
    threatName: { type: String, trim: true },
    rawResultRef: { type: String, trim: true }
  },
  { _id: false }
);

const permissionsSchema = new mongoose.Schema(
  {
    allowedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    allowedRoleCodes: [{ type: String, trim: true }],
    allowedDepartmentCodes: [{ type: String, enum: DEPARTMENT_CODE_VALUES }],
    isDownloadAllowed: { type: Boolean, default: true },
    isPreviewAllowed: { type: Boolean, default: true },
    isPubliclyVerifiable: { type: Boolean, default: false }
  },
  { _id: false }
);

const certificateSchema = new mongoose.Schema(
  {
    isCertificate: { type: Boolean, default: false },
    certificateNumber: { type: String, trim: true },
    verificationToken: { type: String, trim: true },
    issuedAt: Date,
    validFrom: Date,
    validUntil: Date,
    issuerDepartmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES },
    checksum: { type: String, trim: true }
  },
  { _id: false }
);

const digilockerSchema = new mongoose.Schema(
  {
    isFromDigiLocker: { type: Boolean, default: false },
    digilockerDocumentId: { type: String, trim: true },
    issuerId: { type: String, trim: true },
    issuerName: { type: String, trim: true },
    uri: { type: String, trim: true },
    fetchedAt: Date,
    consentId: { type: String, trim: true },
    verificationReference: { type: String, trim: true }
  },
  { _id: false }
);

const retentionSchema = new mongoose.Schema(
  {
    retainUntil: Date,
    legalHold: { type: Boolean, default: false },
    retentionPolicyCode: { type: String, trim: true }
  },
  { _id: false }
);

const accessStatsSchema = new mongoose.Schema(
  {
    downloadCount: { type: Number, default: 0, min: 0 },
    lastDownloadedAt: Date,
    lastAccessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const DocumentSchema = createOperationalSchema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', index: true },
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestorProfile', index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true, sparse: true },
  documentType: { type: String, enum: DOCUMENT_TYPE_VALUES, required: true, index: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  tags: [{ type: String, trim: true, index: true }],
  status: { type: String, enum: DOCUMENT_STATUS_VALUES, default: 'draft', index: true },
  visibility: { type: String, enum: DOCUMENT_VISIBILITY_VALUES, default: 'private', index: true },
  version: { type: Number, min: 1, default: 1 },
  parentDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true },
  supersededByDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  storage: { type: storageSchema, required: true },
  file: { type: fileSchema, required: true },
  hash: { type: hashSchema, required: true },
  verification: { type: verificationSchema, default: () => ({}) },
  scan: { type: scanSchema, default: () => ({}) },
  permissions: { type: permissionsSchema, default: () => ({}) },
  certificate: { type: certificateSchema, default: () => ({}) },
  digilocker: { type: digilockerSchema, default: () => ({}) },
  retention: { type: retentionSchema, default: () => ({}) },
  accessStats: { type: accessStatsSchema, default: () => ({}) },
  correlationId: { type: String, trim: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

DocumentSchema.index({ caseId: 1, documentType: 1, version: 1 });
DocumentSchema.index({ universalCaseId: 1, documentType: 1 });
DocumentSchema.index({ organisationId: 1, createdAt: -1 });
DocumentSchema.index({ uploadedBy: 1, createdAt: -1 });
DocumentSchema.index({ taskId: 1 });
DocumentSchema.index({ departmentCode: 1, status: 1 });
DocumentSchema.index({ status: 1, createdAt: -1 });
DocumentSchema.index({ 'hash.checksum': 1 });
DocumentSchema.index(
  { 'storage.objectKey': 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } }
);
DocumentSchema.index(
  { 'certificate.certificateNumber': 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      isDeleted: false,
      'certificate.certificateNumber': { $type: 'string' }
    }
  }
);
DocumentSchema.index(
  { 'certificate.verificationToken': 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      isDeleted: false,
      'certificate.verificationToken': { $type: 'string' }
    }
  }
);
DocumentSchema.index({ 'digilocker.digilockerDocumentId': 1 }, { sparse: true });
DocumentSchema.index({ isDeleted: 1, createdAt: -1 });

DocumentSchema.pre('validate', function validateDocument(next) {
  if (!this.documentType) {
    return next(new Error('documentType is required.'));
  }
  if (this.storage?.provider !== 'digilocker_reference' && !this.storage?.objectKey) {
    return next(new Error('storage.objectKey is required unless provider is digilocker_reference.'));
  }
  if (!this.file?.originalName && this.storage?.provider !== 'digilocker_reference') {
    return next(new Error('file.originalName is required for uploaded files.'));
  }
  if (!this.hash?.checksum && this.status !== 'draft') {
    return next(new Error('hash.checksum is required after upload.'));
  }
  if (this.version < 1) {
    return next(new Error('version must be at least 1.'));
  }
  if (this.file?.sizeBytes != null && this.file.sizeBytes <= 0 && this.storage?.provider !== 'digilocker_reference') {
    return next(new Error('file.sizeBytes must be positive.'));
  }
  if (
    this.certificate?.isCertificate &&
    ['verified', 'uploaded'].includes(this.status) &&
    !this.certificate?.certificateNumber
  ) {
    return next(new Error('certificateNumber is required for verified certificate documents.'));
  }
  return next();
});

module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
