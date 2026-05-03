const mongoose = require('mongoose');
const {
  createOperationalSchema,
  TASK_STATUS_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

const checklistItemSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    required: { type: Boolean, default: true },
    status: { type: String, trim: true, default: 'pending' },
    remarks: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date
  },
  { _id: false }
);

const queryThreadSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    raisedAt: { type: Date, default: Date.now },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date,
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    status: { type: String, default: 'open' }
  },
  { _id: true }
);

const decisionSchema = new mongoose.Schema(
  {
    outcome: { type: String, trim: true },
    reason: String,
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date
  },
  { _id: false }
);

const ApprovalTaskSchema = createOperationalSchema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  universalCaseId: { type: String, required: true, trim: true, index: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentCode: { type: String, required: true, enum: DEPARTMENT_CODE_VALUES, index: true },
  assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  taskType: {
    type: String,
    enum: ['consent', 'power_connection', 'fire_noc', 'factory_license', 'labour_registration', 'inspection', 'certificate', 'other'],
    default: 'other'
  },
  title: { type: String, required: true, trim: true },
  checklist: [checklistItemSchema],
  status: { type: String, enum: TASK_STATUS_VALUES, default: 'pending', index: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
  externalReferenceId: { type: String, trim: true },
  departmentPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  queryThread: [queryThreadSchema],
  decision: decisionSchema,
  dueAt: Date,
  warningAt: Date,
  completedAt: Date,
  lastSyncedAt: Date,
  syncStatus: { type: String, default: 'not_synced', index: true }
});

ApprovalTaskSchema.index(
  { caseId: 1, departmentCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
ApprovalTaskSchema.index({ departmentCode: 1, status: 1, dueAt: 1 });
ApprovalTaskSchema.index({ assignedOfficerId: 1, status: 1 });
ApprovalTaskSchema.index(
  { externalReferenceId: 1 },
  { sparse: true, partialFilterExpression: { isDeleted: false } }
);

ApprovalTaskSchema.pre('validate', function validateTask(next) {
  const assignedStates = ['assigned', 'under_review', 'query_raised', 'response_received', 'inspection_required', 'inspection_scheduled', 'inspection_completed', 'fee_demanded', 'fee_paid', 'approved', 'rejected', 'returned', 'certificate_issued', 'closed'];
  if (assignedStates.includes(this.status) && !this.dueAt) {
    return next(new Error('dueAt is required after assignment.'));
  }
  return next();
});

module.exports = mongoose.models.ApprovalTask || mongoose.model('ApprovalTask', ApprovalTaskSchema);
