const mongoose = require('mongoose');

const InvestorHistoryProjectionSchema = new mongoose.Schema(
  {
    investorId: { type: String, default: null, trim: true },
    organisationId: { type: String, required: true, trim: true },
    organisationDisplayName: { type: String, default: null, trim: true },
    maskedOrganisationName: { type: String, required: true, trim: true },
    sector: { type: String, default: null, trim: true },
    district: { type: String, default: null, trim: true },
    totalCases: { type: Number, default: 0, min: 0 },
    activeCases: { type: Number, default: 0, min: 0 },
    approvedCases: { type: Number, default: 0, min: 0 },
    rejectedCases: { type: Number, default: 0, min: 0 },
    withdrawnCases: { type: Number, default: 0, min: 0 },
    certificatesIssued: { type: Number, default: 0, min: 0 },
    grievancesRaised: { type: Number, default: 0, min: 0 },
    documentsRejected: { type: Number, default: 0, min: 0 },
    averageTurnaroundHours: { type: Number, default: 0, min: 0 },
    repeatDefectCount: { type: Number, default: 0, min: 0 },
    riskFlags: { type: [String], default: [] },
    lastApplicationAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'investor_history_projections' }
);

InvestorHistoryProjectionSchema.index({ organisationId: 1 }, { unique: true });
InvestorHistoryProjectionSchema.index({ sector: 1, district: 1 });
InvestorHistoryProjectionSchema.index({ totalCases: -1 });
InvestorHistoryProjectionSchema.index({ lastActivityAt: -1 });
InvestorHistoryProjectionSchema.index({ riskFlags: 1 });

module.exports = mongoose.model('InvestorHistoryProjection', InvestorHistoryProjectionSchema);
