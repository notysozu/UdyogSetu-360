const mongoose = require('mongoose');

const CaseSummaryProjectionSchema = new mongoose.Schema(
  {
    universalCaseId: { type: String, required: true, unique: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    organisationName: { type: String, trim: true },
    applicantName: { type: String, trim: true },
    status: { type: String, trim: true, index: true },
    currentStage: { type: String, trim: true },
    departments: [{ type: String, trim: true }],
    pendingTasks: { type: Number, default: 0, min: 0 },
    completedTasks: { type: Number, default: 0, min: 0 },
    overdueTasks: { type: Number, default: 0, min: 0 },
    lastActivityAt: { type: Date, index: true },
    dueAt: Date,
    riskScore: { type: Number, min: 0, max: 1 }
  },
  { timestamps: true }
);

CaseSummaryProjectionSchema.index({ status: 1, lastActivityAt: -1 });
CaseSummaryProjectionSchema.index({ organisationName: 'text' });

module.exports =
  mongoose.models.CaseSummaryProjection ||
  mongoose.model('CaseSummaryProjection', CaseSummaryProjectionSchema);
