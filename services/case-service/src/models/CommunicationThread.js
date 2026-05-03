const mongoose = require('mongoose');
const { createOperationalSchema, DEPARTMENT_CODE_VALUES } = require('../../../../packages/shared/src');

const threadMessageSchema = new mongoose.Schema(
  {
    messageId: { type: String, trim: true },
    authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorRole: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    visibility: {
      type: String,
      enum: ['internal', 'investor_visible', 'department_visible', 'nodal_visible', 'audit_only'],
      default: 'department_visible'
    },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    isSystemGenerated: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: true }
);

const participantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, trim: true },
    departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES }
  },
  { _id: false }
);

const CommunicationThreadSchema = createOperationalSchema({
  threadType: { type: String, enum: ['case', 'task', 'grievance', 'query', 'internal_note', 'escalation'], required: true, index: true },
  resourceType: { type: String, required: true, trim: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  grievanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance', index: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true },
  participants: [participantSchema],
  subject: { type: String, trim: true },
  status: { type: String, enum: ['open', 'waiting_for_investor', 'waiting_for_department', 'resolved', 'closed'], default: 'open', index: true },
  messages: [threadMessageSchema],
  lastMessageAt: Date,
  lastMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visibility: {
    type: String,
    enum: ['internal', 'investor_visible', 'department_visible', 'nodal_visible', 'audit_only'],
    default: 'department_visible'
  },
  correlationId: { type: String, trim: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

CommunicationThreadSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
CommunicationThreadSchema.index({ grievanceId: 1, createdAt: -1 });

module.exports =
  mongoose.models.CommunicationThread ||
  mongoose.model('CommunicationThread', CommunicationThreadSchema);
