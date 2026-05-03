const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    required: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'waived'],
      default: 'pending'
    },
    remarks: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const approvalTaskSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, index: true },
    universalCaseId: { type: String, index: true, sparse: true },
    departmentCode: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      index: true
    },
    taskType: { type: String, trim: true, required: true },
    title: { type: String, trim: true, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'under_review',
        'query_raised',
        'response_received',
        'inspection_required',
        'inspection_scheduled',
        'inspection_completed',
        'fee_demanded',
        'fee_paid',
        'approved',
        'rejected',
        'returned',
        'certificate_issued',
        'closed',
        'cancelled'
      ],
      default: 'pending',
      index: true
    },
    priority: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' },
    checklist: [checklistItemSchema],
    dueAt: { type: Date, index: true },
    warningAt: Date,
    correlationId: { type: String, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, minimize: false }
);

approvalTaskSchema.index({ caseId: 1, departmentCode: 1 });
approvalTaskSchema.index({ departmentCode: 1, status: 1 });

module.exports =
  mongoose.models.ApprovalTask || mongoose.model('ApprovalTask', approvalTaskSchema);
