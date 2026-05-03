const mongoose = require('mongoose');
const {
  createOperationalSchema,
  DEPARTMENT_CODE_VALUES,
  RABBITMQ_QUEUE_STATUSES
} = require('../../../../packages/shared/src');

const QueueJobSchema = createOperationalSchema({
  messageId: { type: String, required: true, trim: true },
  messageType: { type: String, required: true, trim: true, index: true },
  queueName: { type: String, trim: true, index: true },
  exchange: { type: String, trim: true },
  routingKey: { type: String, trim: true, required: true },
  originalRoutingKey: { type: String, trim: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true, sparse: true },
  entityType: { type: String, trim: true, index: true },
  entityId: { type: String, trim: true, index: true },
  universalCaseId: { type: String, trim: true, index: true },
  idempotencyKey: { type: String, trim: true },
  payloadHash: { type: String, trim: true },
  status: {
    type: String,
    enum: Object.values(RABBITMQ_QUEUE_STATUSES),
    default: RABBITMQ_QUEUE_STATUSES.QUEUED,
    index: true
  },
  attemptCount: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 8, min: 1 },
  nextRunAt: { type: Date, index: true },
  lastAttemptAt: Date,
  lockedAt: Date,
  lockedBy: String,
  completedAt: Date,
  deadLetteredAt: { type: Date, index: true },
  failureCode: String,
  failureMessage: String,
  lastErrorStack: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

QueueJobSchema.index({ messageId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
QueueJobSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } });
QueueJobSchema.index({ status: 1, nextRunAt: 1 });
QueueJobSchema.index({ departmentCode: 1, status: 1 });
QueueJobSchema.index({ entityType: 1, entityId: 1 });
QueueJobSchema.index({ universalCaseId: 1, createdAt: -1 });

module.exports = mongoose.models.QueueJob || mongoose.model('QueueJob', QueueJobSchema);
