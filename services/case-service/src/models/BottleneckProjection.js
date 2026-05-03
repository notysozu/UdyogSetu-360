const mongoose = require('mongoose');

const BottleneckProjectionSchema = new mongoose.Schema(
  {
    bottleneckId: { type: String, required: true, unique: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    scopeType: { type: String, default: 'department' },
    scopeId: { type: String, default: 'all' },
    departmentCode: { type: String, index: true },
    stage: { type: String, index: true },
    caseType: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
    bottleneckScore: { type: Number, default: 0, index: true },
    affectedCaseCount: { type: Number, default: 0 },
    averageWaitHours: { type: Number, default: 0 },
    medianWaitHours: { type: Number, default: 0 },
    p90WaitHours: { type: Number, default: 0 },
    oldestPendingHours: { type: Number, default: 0 },
    slaBreachCount: { type: Number, default: 0 },
    queueDepth: { type: Number, default: 0 },
    trendDirection: { type: String, default: 'stable' },
    likelyCause: { type: String, default: '' },
    recommendedAction: { type: String, default: '' },
    evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved', 'ignored'], default: 'open', index: true },
    detectedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

BottleneckProjectionSchema.index({ severity: 1, status: 1, detectedAt: -1 });
BottleneckProjectionSchema.index({ departmentCode: 1, status: 1 });
BottleneckProjectionSchema.index({ stage: 1, status: 1 });
BottleneckProjectionSchema.index({ bottleneckScore: -1, detectedAt: -1 });

module.exports = mongoose.models.BottleneckProjection || mongoose.model('BottleneckProjection', BottleneckProjectionSchema);
