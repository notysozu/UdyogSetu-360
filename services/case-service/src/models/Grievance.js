const mongoose = require('mongoose');
const {
  createOperationalSchema,
  GRIEVANCE_STATUS_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

const messageSchema = new mongoose.Schema(
  {
    messageId: { type: String, trim: true },
    authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorRole: { type: String, trim: true },
    authorDepartmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES },
    body: { type: String, required: true },
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

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, enum: GRIEVANCE_STATUS_VALUES },
    toStatus: { type: String, enum: GRIEVANCE_STATUS_VALUES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByRole: { type: String, trim: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const GrievanceSchema = createOperationalSchema({
  grievanceNumber: { type: String, required: true, trim: true, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  raisedByRole: { type: String, trim: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', index: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true },
  assignedRole: { type: String, trim: true },
  category: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: GRIEVANCE_STATUS_VALUES, default: 'open', index: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
  source: {
    type: String,
    enum: ['investor_portal', 'department_portal', 'nodal_portal', 'public_helpdesk', 'system', 'n8n'],
    default: 'investor_portal'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: Date,
  warningAt: Date,
  messages: [messageSchema],
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  dueAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  closureReason: { type: String, trim: true },
  resolutionSummary: { type: String, trim: true },
  satisfactionRating: { type: Number, min: 1, max: 5 },
  escalationLevel: { type: Number, default: 0, min: 0, index: true },
  currentEscalationOwner: { type: String, trim: true },
  statusHistory: [statusHistorySchema],
  internalTags: [{ type: String, trim: true }],
  correlationId: { type: String, trim: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

GrievanceSchema.index(
  { grievanceNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
GrievanceSchema.index({ raisedBy: 1, createdAt: -1 });
GrievanceSchema.index({ organisationId: 1, createdAt: -1 });
GrievanceSchema.index({ caseId: 1, status: 1 });
GrievanceSchema.index({ departmentCode: 1, status: 1, dueAt: 1 });
GrievanceSchema.index({ assignedTo: 1, status: 1 });
GrievanceSchema.index({ status: 1, priority: 1 });
GrievanceSchema.index({ escalationLevel: 1, status: 1 });

module.exports = mongoose.models.Grievance || mongoose.model('Grievance', GrievanceSchema);
