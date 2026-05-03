const mongoose = require('mongoose');

const PublicMetricsProjectionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    granularity: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily', index: true },
    applicationsReceived: { type: Number, default: 0, min: 0 },
    applicationsSubmitted: { type: Number, default: 0, min: 0 },
    activeApplications: { type: Number, default: 0, min: 0 },
    approvedApplications: { type: Number, default: 0, min: 0 },
    rejectedApplications: { type: Number, default: 0, min: 0 },
    averageTurnaroundDays: { type: Number, default: 0, min: 0 },
    stageCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    approvalRates: { type: mongoose.Schema.Types.Mixed, default: {} },
    certificateBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    grievanceBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    approvalsIssued: { type: Number, default: 0, min: 0 },
    rejectionsIssued: { type: Number, default: 0, min: 0 },
    certificatesIssued: { type: Number, default: 0, min: 0 },
    grievancesOpened: { type: Number, default: 0, min: 0 },
    grievancesResolved: { type: Number, default: 0, min: 0 },
    departmentBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

PublicMetricsProjectionSchema.index(
  { date: 1, granularity: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
PublicMetricsProjectionSchema.index({ granularity: 1, date: 1 });

module.exports =
  mongoose.models.PublicMetricsProjection ||
  mongoose.model('PublicMetricsProjection', PublicMetricsProjectionSchema);
