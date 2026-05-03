const mongoose = require('mongoose');

const ProcessedEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    handlerName: { type: String, required: true, index: true },
    consumerGroup: { type: String, required: true, index: true },
    aggregateType: { type: String, required: true, index: true },
    aggregateId: { type: String, required: true, index: true },
    universalCaseId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed', 'skipped'],
      default: 'processing'
    },
    processedAt: { type: Date, default: null, index: true },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
    correlationId: { type: String, default: null, index: true }
  },
  {
    timestamps: true,
    minimize: false
  }
);

ProcessedEventSchema.index(
  { eventId: 1, handlerName: 1, consumerGroup: 1 },
  { unique: true }
);
ProcessedEventSchema.index({ aggregateType: 1, aggregateId: 1 });
ProcessedEventSchema.index({ status: 1 });
ProcessedEventSchema.index({ universalCaseId: 1, createdAt: -1 });
ProcessedEventSchema.index({ processedAt: -1 });

module.exports =
  mongoose.models.ProcessedEvent ||
  mongoose.model('ProcessedEvent', ProcessedEventSchema);
