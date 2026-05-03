const mongoose = require('mongoose');
const {
  createOperationalSchema,
  CASE_STATUS_VALUES
} = require('../../../../packages/shared/src');

const requiredDepartmentSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, required: true, trim: true },
    reason: { type: String, trim: true },
    requiredApprovalType: { type: String, trim: true },
    isMandatory: { type: Boolean, default: true }
  },
  { _id: false }
);

const approvalTrackSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, required: true, trim: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask' },
    status: { type: String, trim: true, default: 'pending' },
    startedAt: Date,
    completedAt: Date,
    externalReferenceId: { type: String, trim: true }
  },
  { _id: false }
);

const slaSummarySchema = new mongoose.Schema(
  {
    dueAt: Date,
    warningAt: Date,
    breachedAt: Date,
    totalPausedMinutes: { type: Number, default: 0, min: 0 },
    status: { type: String, trim: true, default: 'running' }
  },
  { _id: false }
);

const aiInsightSchema = new mongoose.Schema(
  {
    delayRiskScore: { type: Number, min: 0, max: 1 },
    routeRecommendation: [String],
    summary: String,
    lastAnalysedAt: Date
  },
  { _id: false }
);

const CaseSchema = createOperationalSchema({
  universalCaseId: { type: String, required: true, immutable: true, trim: true },
  sourceSystem: { type: String, default: 'single_window_system', trim: true },
  sourceReferenceId: { type: String, trim: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestorProfile', index: true },
  applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  caseType: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: CASE_STATUS_VALUES, default: 'draft', index: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
  requiredDepartments: [requiredDepartmentSchema],
  approvalTracks: [approvalTrackSchema],
  currentStage: { type: String, trim: true, default: 'draft' },
  submittedAt: Date,
  closedAt: Date,
  reopenedAt: Date,
  lastActivityAt: Date,
  slaSummary: slaSummarySchema,
  tags: [{ type: String, trim: true }],
  riskFlags: [{ type: String, trim: true }],
  aiInsights: aiInsightSchema
});

CaseSchema.index({ universalCaseId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
CaseSchema.index({ organisationId: 1, createdAt: -1 });
CaseSchema.index({ applicantUserId: 1, createdAt: -1 });
CaseSchema.index({ status: 1, updatedAt: -1 });
CaseSchema.index({ 'requiredDepartments.departmentCode': 1 });
CaseSchema.index(
  { sourceSystem: 1, sourceReferenceId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      isDeleted: false,
      sourceReferenceId: { $type: 'string' }
    }
  }
);
CaseSchema.index({ title: 'text', description: 'text', universalCaseId: 'text' });

CaseSchema.pre('validate', function validateCase(next) {
  const submittedOrLater = !['draft', 'withdrawn'].includes(this.status);
  if (submittedOrLater && (!this.requiredDepartments || !this.requiredDepartments.length)) {
    return next(new Error('requiredDepartments cannot be empty after submit.'));
  }
  if (submittedOrLater && !this.submittedAt) {
    return next(new Error('submittedAt is required when status is submitted or later.'));
  }
  return next();
});

module.exports = mongoose.models.Case || mongoose.model('Case', CaseSchema);
