const mongoose = require('mongoose');
const { createOperationalSchema, NOTIFICATION_CHANNEL_VALUES } = require('../../../../packages/shared/src');

const MessageTemplateSchema = createOperationalSchema({
  templateCode: { type: String, required: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  channel: { type: String, enum: NOTIFICATION_CHANNEL_VALUES, required: true, index: true },
  locale: { type: String, default: 'en', trim: true, index: true },
  subjectTemplate: { type: String, trim: true },
  bodyTemplate: { type: String, trim: true },
  smsTemplate: { type: String, trim: true },
  variables: [{ type: String, trim: true }],
  category: {
    type: String,
    enum: ['case', 'task', 'grievance', 'sla', 'certificate', 'fee', 'inspection', 'system'],
    default: 'system'
  },
  isActive: { type: Boolean, default: true, index: true },
  version: { type: Number, default: 1, min: 1, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

MessageTemplateSchema.index(
  { templateCode: 1, channel: 1, locale: 1, version: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
MessageTemplateSchema.index({ templateCode: 1, isActive: 1 });
MessageTemplateSchema.index({ channel: 1, locale: 1 });

module.exports =
  mongoose.models.MessageTemplate ||
  mongoose.model('MessageTemplate', MessageTemplateSchema);
