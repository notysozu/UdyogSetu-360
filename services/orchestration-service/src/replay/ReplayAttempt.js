const mongoose = require('mongoose');

const ReplayAttemptSchema = new mongoose.Schema(
  {
    replayId: { type: String, required: true, unique: true, index: true },
    requestedBy: { type: String, index: true },
    requestedByRole: String,
    reason: { type: String, required: true },
    mode: {
      type: String,
      enum: ['dry_run', 'republish', 'reprocess_handlers', 'rebuild_projection'],
      default: 'dry_run'
    },
    filter: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['requested', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled'],
      default: 'requested',
      index: true
    },
    dryRun: { type: Boolean, default: true },
    totalEvents: { type: Number, default: 0 },
    processedEvents: { type: Number, default: 0 },
    failedEvents: { type: Number, default: 0 },
    skippedEvents: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
    failureReason: String,
    correlationId: { type: String, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

ReplayAttemptSchema.index({ requestedBy: 1, createdAt: -1 });
ReplayAttemptSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.ReplayAttempt || mongoose.model('ReplayAttempt', ReplayAttemptSchema);
