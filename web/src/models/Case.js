const mongoose = require('mongoose');

const legacyNoteSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, trim: true },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const legacyDocumentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    fileName: String,
    storageKey: String,
    hash: String,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const legacyApprovalTaskSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    status: {
      type: String,
      enum: [
        'PENDING',
        'ACKNOWLEDGED',
        'UNDER_SCRUTINY',
        'QUERY_RAISED',
        'INSPECTION_SCHEDULED',
        'APPROVED',
        'REJECTED',
        'CERTIFICATE_ISSUED'
      ],
      default: 'PENDING',
      index: true
    },
    slaDueAt: { type: Date, index: true },
    lastEventAt: Date,
    certificateRef: String,
    notes: [legacyNoteSchema]
  },
  { _id: true }
);

const requiredDepartmentSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, trim: true, lowercase: true, required: true },
    reason: { type: String, trim: true },
    requiredApprovalType: { type: String, trim: true },
    isMandatory: { type: Boolean, default: true }
  },
  { _id: false }
);

const approvalTrackSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, trim: true, lowercase: true, required: true },
    taskType: { type: String, trim: true, required: true },
    title: { type: String, trim: true, required: true },
    slaDays: { type: Number, min: 1, default: 15 },
    status: { type: String, trim: true, default: 'pending' },
    explanation: { type: String, trim: true },
    requiredAttachments: [{ type: String, trim: true, lowercase: true }]
  },
  { _id: false }
);

const amendmentSchema = new mongoose.Schema(
  {
    amendmentNumber: { type: Number, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true, required: true },
    patch: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['requested', 'applied', 'rejected', 'cancelled'],
      default: 'requested'
    },
    requestedAt: { type: Date, default: Date.now },
    appliedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: true, minimize: false }
);

const resubmissionSchema = new mongoose.Schema(
  {
    resubmissionNumber: { type: Number, required: true },
    reason: { type: String, trim: true, required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    changedFields: [{ type: String, trim: true }],
    responseToQueryId: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: true, minimize: false }
);

const duplicateMatchSchema = new mongoose.Schema(
  {
    caseId: { type: String, trim: true },
    universalCaseId: { type: String, trim: true },
    reason: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 100 }
  },
  { _id: false }
);

const acknowledgementSchema = new mongoose.Schema(
  {
    acknowledgementNumber: { type: String, trim: true },
    submittedAt: Date,
    applicantName: String,
    organisationName: String,
    projectName: String,
    taskCount: Number,
    attachmentCount: Number,
    verificationNote: String,
    generatedBy: { type: String, default: 'system' },
    checksum: String
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    universalCaseId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
      immutable: true
    },
    applicationType: { type: String, default: 'combined_application_form' },
    sourceSystem: { type: String, trim: true, default: 'sws_portal' },
    sourceReferenceId: { type: String, trim: true, sparse: true },
    organisationId: { type: String, trim: true, default: null, index: true },
    investorId: { type: String, trim: true, default: null, index: true },
    applicantUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    applicant: {
      name: { type: String, trim: true },
      email: String,
      mobile: String
    },
    enterprise: {
      name: { type: String, trim: true },
      industry: String,
      district: String,
      investmentSize: String,
      landArea: String
    },
    caseType: { type: String, trim: true, default: 'combined_application_form' },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'under_scrutiny',
        'query_raised',
        'response_submitted',
        'approved',
        'rejected',
        'closed',
        'reopened',
        'withdrawn'
      ],
      default: 'draft',
      index: true
    },
    currentStage: { type: String, default: 'Draft preparation' },
    priority: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' },
    cafData: { type: mongoose.Schema.Types.Mixed, default: {} },
    validationWarnings: [{ type: String, trim: true }],
    requiredDepartments: [requiredDepartmentSchema],
    approvalTracks: [approvalTrackSchema],
    approvals: [legacyApprovalTaskSchema],
    documents: [legacyDocumentSchema],
    submittedAt: Date,
    resubmittedAt: Date,
    closedAt: Date,
    reopenedAt: Date,
    lastActivityAt: { type: Date, default: Date.now },
    duplicateCheck: {
      isDuplicate: { type: Boolean, default: false },
      blocking: { type: Boolean, default: false },
      confidence: { type: Number, min: 0, max: 100, default: 0 },
      reasons: [{ type: String, trim: true }],
      matchedCases: [duplicateMatchSchema],
      duplicateOverrideConfirmed: { type: Boolean, default: false },
      duplicateOverrideReason: String,
      checkedAt: Date
    },
    acknowledgement: acknowledgementSchema,
    amendmentHistory: [amendmentSchema],
    resubmissionHistory: [resubmissionSchema],
    submissionIdempotencyKeys: [{ type: String, trim: true }],
    ai: {
      routeConfidence: Number,
      delayRisk: Number,
      summary: String,
      lastCheckedAt: Date
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    correlationId: { type: String, index: true },
    softDeletedAt: Date
  },
  { timestamps: true, minimize: false }
);

caseSchema.index({ status: 1, createdAt: -1 });
caseSchema.index({ sourceSystem: 1, sourceReferenceId: 1 }, { unique: true, sparse: true });
caseSchema.index({ 'cafData.enterprise.gstin': 1 });
caseSchema.index({ 'cafData.enterprise.pan': 1 });
caseSchema.index({ 'cafData.enterprise.udyamNumber': 1 });
caseSchema.index({ 'cafData.project.projectName': 1, 'cafData.project.projectDistrict': 1 });
caseSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.models.Case || mongoose.model('Case', caseSchema);
