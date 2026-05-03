const mongoose = require('mongoose');

const StuckCaseFindingSchema = new mongoose.Schema(
  {
    findingId: { type: String, required: true, unique: true, index: true },
    universalCaseId: { type: String, index: true },
    caseId: { type: String, index: true },
    taskId: { type: String, index: true },
    departmentCode: { type: String, index: true },
    findingType: {
      type: String,
      enum: [
        'no_activity',
        'missing_tasks',
        'overdue_task',
        'overdue_query_response',
        'overdue_inspection',
        'overdue_fee_payment',
        'certificate_not_issued',
        'aggregate_status_mismatch',
        'outbox_stuck',
        'queue_deadlettered',
        'adapter_repeated_failure'
      ],
      required: true,
      index: true
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved', 'ignored'], default: 'open', index: true },
    title: String,
    description: String,
    detectedAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    resolvedAt: Date,
    resolutionReason: String,
    recommendedAction: String,
    evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    correlationId: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

StuckCaseFindingSchema.index({ universalCaseId: 1, status: 1 });
StuckCaseFindingSchema.index({ findingType: 1, status: 1 });
StuckCaseFindingSchema.index({ severity: 1, status: 1 });
StuckCaseFindingSchema.index({ departmentCode: 1, status: 1 });

module.exports = mongoose.models.StuckCaseFinding || mongoose.model('StuckCaseFinding', StuckCaseFindingSchema);
