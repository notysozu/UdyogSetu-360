const mongoose = require('mongoose');
const {
  createOperationalSchema,
  validateSnakeCase
} = require('../../../../packages/shared/src');

const RoleSchema = createOperationalSchema({
  code: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validateSnakeCase,
      message: 'Role code must be lowercase snake_case.'
    }
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  permissions: [{ type: String, trim: true }],
  isSystemRole: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true }
});

RoleSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

module.exports = mongoose.models.Role || mongoose.model('Role', RoleSchema);
