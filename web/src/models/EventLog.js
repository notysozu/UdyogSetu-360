const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const eventLogSchema = new mongoose.Schema({
  eventId: { type: String, default: randomUUID, unique: true },
  type: { type: String, required: true, index: true },
  version: { type: String, default: '1.0' },
  source: { type: String, default: 'udyogsetu-web' },
  caseId: { type: String, index: true },
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    name: String
  },
  correlationId: { type: String, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now, immutable: true }
}, { timestamps: true });

eventLogSchema.index({ caseId: 1, occurredAt: -1 });

module.exports = mongoose.model('EventLog', eventLogSchema);
