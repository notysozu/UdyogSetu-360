const mongoose = require('mongoose');
const { createOperationalSchema, DEPARTMENT_CODE_VALUES } = require('../../../../packages/shared/src');

const levelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true, min: 1 },
    triggerAfterMinutes: { type: Number, required: true, min: 0 },
    triggerCondition: { type: String, trim: true, default: 'overdue' },
    notifyRoles: [{ type: String, trim: true }],
    notifyUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    action: {
      type: String,
      enum: ['notify', 'assign_supervisor', 'assign_nodal', 'escalate_admin', 'create_grievance', 'webhook', 'n8n_workflow'],
      default: 'notify'
    },
    messageTemplateCode: { type: String, trim: true }
  },
  { _id: false }
);

const EscalationPolicySchema = createOperationalSchema({
  policyCode: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  entityType: {
    type: String,
    enum: ['case', 'task', 'grievance', 'inspection', 'document_verification', 'fee', 'certificate'],
    required: true,
    index: true
  },
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, index: true },
  category: { type: String, trim: true, index: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
  levels: [levelSchema],
  isActive: { type: Boolean, default: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

EscalationPolicySchema.index(
  { policyCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
EscalationPolicySchema.index({ entityType: 1, departmentCode: 1, isActive: 1 });
EscalationPolicySchema.index({ category: 1, priority: 1 });

module.exports =
  mongoose.models.EscalationPolicy ||
  mongoose.model('EscalationPolicy', EscalationPolicySchema);
