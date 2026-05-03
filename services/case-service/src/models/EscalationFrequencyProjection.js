const mongoose = require('mongoose');

const EscalationFrequencyProjectionSchema = new mongoose.Schema(
  {
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    departmentCode: { type: String, required: true, trim: true },
    escalationType: { type: String, default: 'sla', trim: true },
    escalationLevel: { type: Number, default: 1, min: 1 },
    escalationCount: { type: Number, default: 0, min: 0 },
    affectedCaseCount: { type: Number, default: 0, min: 0 },
    averageTimeToEscalationHours: { type: Number, default: 0, min: 0 },
    repeatedEntities: { type: [String], default: [] },
    topReasons: { type: [String], default: [] },
    resolutionRate: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'escalation_frequency_projections' }
);

EscalationFrequencyProjectionSchema.index({ departmentCode: 1, periodEnd: -1 });
EscalationFrequencyProjectionSchema.index({ escalationLevel: 1, periodEnd: -1 });
EscalationFrequencyProjectionSchema.index({ escalationCount: -1, periodEnd: -1 });

module.exports = mongoose.model('EscalationFrequencyProjection', EscalationFrequencyProjectionSchema);
