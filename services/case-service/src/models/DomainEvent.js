const mongoose = require('mongoose');

const DomainEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventName: { type: String, required: true, index: true },
    eventVersion: { type: String, default: '1.0' },
    source: { type: String, required: true },
    subject: { type: String, required: true },
    correlationId: { type: String, index: true },
    causationId: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true },
    aggregateType: { type: String, required: true, index: true },
    aggregateId: { type: String, required: true, index: true },
    universalCaseId: { type: String, trim: true, index: true },
    topic: { type: String, trim: true, index: true },
    partitionKey: { type: String, trim: true, index: true },
    envelope: { type: mongoose.Schema.Types.Mixed, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    publishStatus: {
      type: String,
      enum: ['pending', 'publishing', 'published', 'failed', 'dead_lettered'],
      default: 'pending',
      index: true
    },
    publishAttempts: { type: Number, default: 0, min: 0 },
    nextPublishAt: { type: Date, default: Date.now, index: true },
    publishedAt: Date,
    failureReason: String,
    lastError: { type: mongoose.Schema.Types.Mixed, default: null },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    minimize: false
  }
);

DomainEventSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true }
);
DomainEventSchema.index({ eventName: 1, createdAt: -1 });
DomainEventSchema.index({ aggregateType: 1, aggregateId: 1, createdAt: -1 });
DomainEventSchema.index({ publishStatus: 1, nextPublishAt: 1 });
DomainEventSchema.index({ universalCaseId: 1, createdAt: -1 });
DomainEventSchema.index({ topic: 1, createdAt: -1 });
DomainEventSchema.index({ lockedAt: 1 });

module.exports = mongoose.models.DomainEvent || mongoose.model('DomainEvent', DomainEventSchema);
