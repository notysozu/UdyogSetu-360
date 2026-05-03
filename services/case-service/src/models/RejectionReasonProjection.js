const mongoose = require('mongoose');

const RejectionReasonProjectionSchema = new mongoose.Schema(
  {
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    departmentCode: { type: String, required: true, trim: true },
    caseType: { type: String, default: null, trim: true },
    taskType: { type: String, default: null, trim: true },
    rejectionCategory: { type: String, required: true, trim: true },
    rejectionReason: { type: String, required: true, trim: true },
    rejectionCount: { type: Number, default: 0, min: 0 },
    affectedCaseCount: { type: Number, default: 0, min: 0 },
    percentageOfRejections: { type: Number, default: 0, min: 0 },
    trendDirection: { type: String, enum: ['up', 'flat', 'down'], default: 'flat' },
    examples: { type: [String], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'rejection_reason_projections' }
);

RejectionReasonProjectionSchema.index({ departmentCode: 1, periodEnd: -1 });
RejectionReasonProjectionSchema.index({ rejectionCategory: 1, rejectionCount: -1 });
RejectionReasonProjectionSchema.index({ periodStart: 1, periodEnd: 1 });

module.exports = mongoose.model('RejectionReasonProjection', RejectionReasonProjectionSchema);
