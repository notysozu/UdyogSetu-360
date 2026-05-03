const mongoose = require('mongoose');

const AnalyticsDailyRollupSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    granularity: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily', index: true },
    scopeType: { type: String, default: 'global', index: true },
    scopeId: { type: String, default: 'all', index: true },
    departmentCode: { type: String, index: true },
    district: { type: String, index: true },
    sector: { type: String, index: true },
    applicationsReceived: { type: Number, default: 0 },
    applicationsSubmitted: { type: Number, default: 0 },
    applicationsApproved: { type: Number, default: 0 },
    applicationsRejected: { type: Number, default: 0 },
    applicationsClosed: { type: Number, default: 0 },
    activeCases: { type: Number, default: 0 },
    certificatesIssued: { type: Number, default: 0 },
    grievancesOpened: { type: Number, default: 0 },
    grievancesResolved: { type: Number, default: 0 },
    queriesRaised: { type: Number, default: 0 },
    queriesResponded: { type: Number, default: 0 },
    inspectionsScheduled: { type: Number, default: 0 },
    inspectionsCompleted: { type: Number, default: 0 },
    feesDemanded: { type: Number, default: 0 },
    feesPaid: { type: Number, default: 0 },
    slaWarnings: { type: Number, default: 0 },
    slaBreaches: { type: Number, default: 0 },
    escalationsRaised: { type: Number, default: 0 },
    averageTurnaroundHours: { type: Number, default: 0 },
    medianTurnaroundHours: { type: Number, default: 0 },
    averageQueryAgeHours: { type: Number, default: 0 },
    averageGrievanceResolutionHours: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

AnalyticsDailyRollupSchema.index({ date: 1, granularity: 1, scopeType: 1, scopeId: 1, departmentCode: 1 }, { unique: true });
AnalyticsDailyRollupSchema.index({ date: 1, departmentCode: 1 });
AnalyticsDailyRollupSchema.index({ date: 1, district: 1 });
AnalyticsDailyRollupSchema.index({ date: 1, sector: 1 });

module.exports = mongoose.models.AnalyticsDailyRollup || mongoose.model('AnalyticsDailyRollup', AnalyticsDailyRollupSchema);
