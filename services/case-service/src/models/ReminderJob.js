const mongoose = require('mongoose');
const { createOperationalSchema } = require('../../../../packages/shared/src');

const ReminderJobSchema = createOperationalSchema({
  jobCode: { type: String, required: true, trim: true, index: true },
  entityType: {
    type: String,
    enum: ['case', 'task', 'grievance', 'inspection', 'document_verification', 'fee', 'certificate'],
    required: true,
    index: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  grievanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance', index: true },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationServiceNotification', index: true },
  reminderType: {
    type: String,
    enum: ['sla_warning', 'sla_breach', 'query_response_due', 'fee_payment_due', 'inspection_upcoming', 'certificate_renewal', 'grievance_due', 'grievance_overdue'],
    required: true,
    index: true
  },
  status: { type: String, enum: ['scheduled', 'processing', 'sent', 'failed', 'cancelled', 'expired'], default: 'scheduled', index: true },
  scheduledFor: { type: Date, required: true, index: true },
  executedAt: Date,
  cancelledAt: Date,
  failureReason: String,
  attemptCount: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 3, min: 0 },
  correlationId: { type: String, trim: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

ReminderJobSchema.index(
  { jobCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
ReminderJobSchema.index({ status: 1, scheduledFor: 1 });

module.exports =
  mongoose.models.ReminderJob ||
  mongoose.model('ReminderJob', ReminderJobSchema);
