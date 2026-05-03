const mongoose = require('mongoose');
const {
  createOperationalSchema,
  INSPECTION_STATUS_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

const checklistSchema = new mongoose.Schema(
  {
    code: String,
    label: String,
    status: String,
    remarks: String
  },
  { _id: false }
);

const rescheduleHistorySchema = new mongoose.Schema(
  {
    previousScheduledAt: Date,
    nextScheduledAt: Date,
    reason: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const InspectionSchema = createOperationalSchema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, required: true, index: true },
  inspectionType: { type: String, trim: true, default: 'site' },
  status: { type: String, enum: INSPECTION_STATUS_VALUES, default: 'requested', index: true },
  scheduledAt: { type: Date, index: true },
  scheduledEndAt: Date,
  location: String,
  assignedInspectorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  checklist: [checklistSchema],
  findings: [{ type: String }],
  result: String,
  reportDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  rescheduleHistory: [rescheduleHistorySchema],
  completedAt: Date
});

InspectionSchema.index({ departmentCode: 1, status: 1, scheduledAt: 1 });
InspectionSchema.index({ assignedInspectorIds: 1 });

InspectionSchema.pre('validate', function validateInspection(next) {
  if (['scheduled', 'rescheduled'].includes(this.status) && !this.scheduledAt) {
    return next(new Error('scheduledAt is required for scheduled status.'));
  }
  if (this.status === 'completed' && !this.completedAt) {
    return next(new Error('completedAt is required for completed status.'));
  }
  return next();
});

module.exports = mongoose.models.Inspection || mongoose.model('Inspection', InspectionSchema);
