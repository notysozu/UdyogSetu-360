const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const domainEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, default: randomUUID, unique: true, index: true },
    eventName: { type: String, required: true, index: true },
    eventVersion: { type: String, default: 'v1' },
    source: { type: String, default: 'udyogsetu-web' },
    subject: { type: String, required: true },
    correlationId: { type: String, index: true },
    causationId: { type: String, default: null },
    idempotencyKey: { type: String, default: null, index: true, sparse: true },
    aggregateType: { type: String, required: true, index: true },
    aggregateId: { type: String, required: true, index: true },
    universalCaseId: { type: String, index: true, sparse: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    publishStatus: {
      type: String,
      enum: ['pending', 'published', 'failed', 'dead_lettered'],
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    minimize: false
  }
);

domainEventSchema.index({ aggregateType: 1, aggregateId: 1, createdAt: -1 });

module.exports =
  mongoose.models.DomainEvent || mongoose.model('DomainEvent', domainEventSchema);
