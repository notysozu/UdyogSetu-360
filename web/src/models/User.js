const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLE_VALUES, USER_ROLES, PERMISSION_VALUES, ROLE_PERMISSIONS } = require('../../../packages/shared/src');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: [...USER_ROLE_VALUES.filter((role) => role !== USER_ROLES.SYSTEM), 'supervisor'],
    required: true,
    index: true
  },
  roles: {
    type: [{ type: String, enum: USER_ROLE_VALUES }],
    default: undefined
  },
  primaryRole: {
    type: String,
    enum: USER_ROLE_VALUES,
    index: true
  },
  permissions: {
    type: [{ type: String, enum: PERMISSION_VALUES }],
    default: []
  },
  organisation: { type: String, trim: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestorProfile', index: true },
  status: {
    type: String,
    enum: ['invited', 'active', 'suspended', 'locked', 'disabled'],
    default: 'active',
    index: true
  },
  emailVerifiedAt: Date,
  phoneVerifiedAt: Date,
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0, min: 0 },
  lockedUntil: Date,
  passwordChangedAt: Date,
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: Date,
  emailVerificationTokenHash: { type: String, select: false },
  emailVerificationExpiresAt: Date,
  otpHash: { type: String, select: false },
  otpExpiresAt: Date,
  otpAttempts: { type: Number, default: 0, min: 0 },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  locale: { type: String, default: 'en-IN' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

userSchema.pre('validate', function syncRoleFields(next) {
  if (this.role === 'supervisor') {
    this.role = 'department_supervisor';
  }
  if (this.primaryRole === 'supervisor') {
    this.primaryRole = 'department_supervisor';
  }
  this.primaryRole = this.primaryRole || this.role;
  this.role = this.role || this.primaryRole;
  if (!this.roles || !this.roles.length) {
    this.roles = [this.primaryRole];
  }
  if (this.primaryRole && !this.roles.includes(this.primaryRole)) {
    this.roles.push(this.primaryRole);
  }
  if (!this.permissions || !this.permissions.length) {
    this.permissions = [...new Set(
      this.roles.flatMap((role) => ROLE_PERMISSIONS[role] || [])
    )];
  }
  if (!this.departmentId && this.department) {
    this.departmentId = this.department;
  }
  if (!this.department && this.departmentId) {
    this.department = this.departmentId;
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
  this.passwordChangedAt = new Date();
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const object = this.toObject();
  delete object.passwordHash;
  delete object.passwordResetTokenHash;
  delete object.emailVerificationTokenHash;
  delete object.otpHash;
  return object;
};

userSchema.methods.hasRole = function hasRole(role) {
  return this.roles?.includes(role) || this.primaryRole === role || this.role === role;
};

userSchema.methods.hasPermission = function hasPermission(permission) {
  return (this.permissions || []).includes(permission);
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date()) || this.status === 'locked';
};

userSchema.methods.incrementFailedLogin = async function incrementFailedLogin() {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    this.status = 'locked';
  }
  await this.save();
};

userSchema.methods.resetFailedLogin = async function resetFailedLogin() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  if (this.status === 'locked') {
    this.status = 'active';
  }
  await this.save();
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.passwordResetTokenHash;
    delete ret.emailVerificationTokenHash;
    delete ret.otpHash;
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
