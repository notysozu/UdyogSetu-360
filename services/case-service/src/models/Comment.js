const mongoose = require('mongoose');
const { createOperationalSchema, DEPARTMENT_CODE_VALUES } = require('../../../../packages/shared/src');

const attachmentSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    title: String
  },
  { _id: false }
);

const CommentSchema = createOperationalSchema({
  resourceType: {
    type: String,
    enum: ['case', 'task', 'grievance', 'inspection', 'fee', 'certificate'],
    required: true,
    index: true
  },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  authorRole: { type: String, trim: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true },
  body: { type: String, required: true, trim: true },
  visibility: {
    type: String,
    enum: ['internal', 'investor_visible', 'audit_only', 'nodal_visible'],
    default: 'internal',
    index: true
  },
  attachments: [attachmentSchema],
  mentions: [{ type: String, trim: true }],
  isSystemGenerated: { type: Boolean, default: false },
  correlationId: { type: String, trim: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

CommentSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
CommentSchema.index({ caseId: 1, createdAt: -1 });
CommentSchema.index({ taskId: 1, createdAt: -1 });
CommentSchema.index({ departmentCode: 1, createdAt: -1 });
CommentSchema.index({ authorUserId: 1, createdAt: -1 });

module.exports = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
