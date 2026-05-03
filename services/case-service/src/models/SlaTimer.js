const mongoose = require('mongoose');
const {
  createOperationalSchema,
  SLA_TIMER_STATUS_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

const pauseHistorySchema = new mongoose.Schema(
  {
    pausedAt: Date,
    resumedAt: Date,
    reason: String,
    pausedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const SlaTimerSchema = createOperationalSchema({
  entityType: {
    type: String,
    enum: ['case', 'task', 'grievance', 'inspection', 'document_verification', 'fee', 'certificate'],
    index: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  grievanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance', index: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true },
  timerType: { type: String, enum: ['approval', 'grievance_resolution', 'query_response', 'inspection', 'fee_payment', 'certificate_issue'], required: true },
  status: { type: String, enum: SLA_TIMER_STATUS_VALUES, default: 'running', index: true },
  startsAt: { type: Date, required: true },
  dueAt: { type: Date, required: true, index: true },
  warningAt: Date,
  pausedAt: Date,
  resumedAt: Date,
  completedAt: Date,
  breachedAt: Date,
  pauseHistory: [pauseHistorySchema],
  warningSentAt: Date,
  breachNotifiedAt: Date,
  escalationLevel: { type: Number, default: 0, min: 0, index: true },
  currentEscalationOwner: { type: String, trim: true },
  escalationHistory: [{ type: mongoose.Schema.Types.Mixed }],
  reminderHistory: [{ type: mongoose.Schema.Types.Mixed }],
  correlationId: { type: String, trim: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

SlaTimerSchema.index({ entityType: 1, entityId: 1 });
SlaTimerSchema.index({ status: 1, dueAt: 1 });
SlaTimerSchema.index({ status: 1, warningAt: 1 });
SlaTimerSchema.index({ departmentCode: 1, status: 1 });
SlaTimerSchema.index({ departmentCode: 1, status: 1, dueAt: 1 });
SlaTimerSchema.index({ escalationLevel: 1, status: 1 });

SlaTimerSchema.pre('validate', function validateSlaTimer(next) {
  if (!this.caseId && !this.taskId && !this.grievanceId) {
    return next(new Error('At least one of caseId, taskId, or grievanceId is required.'));
  }
  if (this.startsAt && this.dueAt && this.dueAt <= this.startsAt) {
    return next(new Error('dueAt must be after startsAt.'));
  }
  return next();
});

module.exports = mongoose.models.SlaTimer || mongoose.model('SlaTimer', SlaTimerSchema);
