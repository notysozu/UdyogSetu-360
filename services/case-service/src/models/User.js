const mongoose = require('mongoose');
const { createOperationalSchema, USER_ROLE_VALUES, USER_ROLES } = require('../../../../packages/shared/src');

const preferenceSchema = new mongoose.Schema(
  {
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
    accessibility: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const UserSchema = createOperationalSchema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  passwordHash: {
    type: String,
    required: function passwordRequired() {
      return this.primaryRole !== USER_ROLES.SYSTEM;
    },
    select: false
  },
  roles: {
    type: [{ type: String, enum: USER_ROLE_VALUES }],
    required: true,
    validate: {
      validator(value) {
        return Array.isArray(value) && value.length > 0 && value.includes(this.primaryRole);
      },
      message: 'roles must include primaryRole.'
    }
  },
  primaryRole: { type: String, required: true, enum: USER_ROLE_VALUES, index: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', index: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestorProfile', index: true },
  status: {
    type: String,
    enum: ['invited', 'active', 'suspended', 'locked', 'disabled'],
    default: 'invited',
    index: true
  },
  emailVerifiedAt: Date,
  phoneVerifiedAt: Date,
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0, min: 0 },
  lockedUntil: Date,
  preferences: { type: preferenceSchema, default: () => ({}) },
  locale: { type: String, default: 'en-IN' },
  timezone: { type: String, default: 'Asia/Kolkata' }
});

UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
UserSchema.index(
  { phone: 1 },
  { sparse: true, partialFilterExpression: { isDeleted: false } }
);

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  const object = this.toObject();
  delete object.passwordHash;
  return object;
};

UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
