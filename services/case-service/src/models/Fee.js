const mongoose = require('mongoose');
const {
  createOperationalSchema,
  FEE_STATUS_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

const FeeSchema = createOperationalSchema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  universalCaseId: { type: String, trim: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalTask', index: true },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, required: true, index: true },
  feeType: { type: String, trim: true, required: true },
  status: { type: String, enum: FEE_STATUS_VALUES, default: 'draft', index: true },
  currency: { type: String, default: 'INR' },
  amount: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },
  demandReference: { type: String, trim: true },
  demandedAt: Date,
  dueAt: Date,
  paidAt: Date,
  paymentProvider: String,
  paymentReference: { type: String, trim: true },
  receiptDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }
});

FeeSchema.index({ departmentCode: 1, status: 1 });
FeeSchema.index(
  { demandReference: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } }
);
FeeSchema.index({ paymentReference: 1 }, { sparse: true });

FeeSchema.pre('validate', function validateFee(next) {
  if (this.totalAmount < this.amount) {
    return next(new Error('totalAmount must be greater than or equal to amount.'));
  }
  return next();
});

module.exports = mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
