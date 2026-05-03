const mongoose = require('mongoose');
const { createOperationalSchema, RETRY_STATUS_VALUES } = require('../../../../packages/shared/src');

const RetryJobSchema = createOperationalSchema({
  jobType: { type: String, required: true, trim: true, index: true },
  targetService: { type: String, trim: true },
  targetEndpoint: { type: String, trim: true },
  relatedEntityType: { type: String, trim: true, index: true },
  relatedEntityId: { type: String, trim: true, index: true },
  eventId: { type: String, trim: true, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: RETRY_STATUS_VALUES, default: 'pending', index: true },
  attemptCount: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 5, min: 0 },
  nextRunAt: { type: Date, required: true, index: true },
  lastAttemptAt: Date,
  errorCode: String,
  errorMessage: String,
  deadLetterReason: String
});

RetryJobSchema.index({ status: 1, nextRunAt: 1 });
RetryJobSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });

module.exports = mongoose.models.RetryJob || mongoose.model('RetryJob', RetryJobSchema);
