const mongoose = require('mongoose');
const {
  createOperationalSchema,
  NOTIFICATION_CHANNEL_VALUES,
  NOTIFICATION_STATUS_VALUES,
  NOTIFICATION_PRIORITY_VALUES,
  DEPARTMENT_CODE_VALUES,
  USER_ROLE_VALUES
} = require('../../../../packages/shared/src');

const NotificationSchema = createOperationalSchema({
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  recipientRole: { type: String, enum: USER_ROLE_VALUES, index: true },
  recipientDepartmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  grievanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance', index: true },
  channel: { type: String, enum: NOTIFICATION_CHANNEL_VALUES, required: true, index: true },
  templateCode: { type: String, trim: true, index: true },
  title: { type: String, trim: true },
  subject: { type: String, trim: true },
  body: { type: String, required: true },
  actionUrl: { type: String, trim: true },
  priority: { type: String, enum: NOTIFICATION_PRIORITY_VALUES, default: 'normal', index: true },
  status: { type: String, enum: NOTIFICATION_STATUS_VALUES, default: 'queued', index: true },
  readAt: Date,
  sentAt: Date,
  deliveredAt: Date,
  failedAt: Date,
  failureReason: String,
  provider: { type: String, trim: true },
  providerMessageId: String,
  retryCount: { type: Number, default: 0, min: 0 },
  maxRetries: { type: Number, default: 3, min: 0 },
  scheduledFor: { type: Date, index: true },
  expiresAt: { type: Date, index: true },
  correlationId: { type: String, trim: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

NotificationSchema.index({ recipientUserId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, createdAt: -1 });
NotificationSchema.index({ recipientDepartmentCode: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ caseId: 1, createdAt: -1 });
NotificationSchema.index({ taskId: 1, createdAt: -1 });
NotificationSchema.index({ grievanceId: 1, createdAt: -1 });
NotificationSchema.index({ channel: 1, status: 1, scheduledFor: 1 });
NotificationSchema.index({ templateCode: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 });

NotificationSchema.pre('validate', function validateNotification(next) {
  if (!this.recipientUserId && !this.recipientRole) {
    return next(new Error('recipientUserId or recipientRole is required.'));
  }
  return next();
});

module.exports =
  mongoose.models.NotificationServiceNotification ||
  mongoose.model('NotificationServiceNotification', NotificationSchema);
