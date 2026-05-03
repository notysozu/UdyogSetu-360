const User = require('../models/User');
const { AUDIT_ACTIONS, USER_ROLES } = require('../../../packages/shared/src');
const { hashPassword, comparePassword, validatePasswordStrength, hashToken } = require('./passwordService');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('./tokenService');
const sessionService = require('./sessionService');
const { audit } = require('./auditLogService');
const { createPasswordReset, createEmailVerification, createOtp } = require('./verificationService');

function sessionUserFromUser(user, sessionId) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    roles: user.roles,
    primaryRole: user.primaryRole,
    permissions: user.permissions,
    organisation: user.organisation,
    organisationId: user.organisationId?.toString?.() || null,
    department: user.department?._id?.toString?.() || user.department?.toString?.() || null,
    departmentId: user.departmentId?.toString?.() || user.department?.toString?.() || null,
    departmentCode: user.department?.code || null,
    investorId: user.investorId?.toString?.() || null,
    sessionId
  };
}

async function registerInvestor(input, context = {}) {
  validatePasswordStrength(input.password);
  const existing = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (existing) {
    const error = new Error('An account already exists for this email.');
    error.status = 409;
    throw error;
  }

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: USER_ROLES.INVESTOR,
    roles: [USER_ROLES.INVESTOR],
    primaryRole: USER_ROLES.INVESTOR,
    status: 'active',
    organisation: input.organisation,
    locale: 'en-IN',
    timezone: 'Asia/Kolkata'
  });

  await audit(AUDIT_ACTIONS.CREATED, 'user', user._id, context, {
    metadata: { email: user.email, role: user.role }
  });

  return user;
}

async function authenticateLocalUser(email, password, context = {}) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash').populate('department');

  if (!user) {
    await audit(AUDIT_ACTIONS.AUTH_LOGIN_FAILED, 'user', email || 'unknown', context, {
      metadata: { reason: 'user_not_found', email }
    });
    const error = new Error('Invalid credentials.');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (user.status === 'disabled' || user.status === 'suspended') {
    await audit(AUDIT_ACTIONS.AUTH_LOGIN_FAILED, 'user', user._id, context, {
      metadata: { reason: 'account_disabled', status: user.status }
    });
    const error = new Error('Account disabled.');
    error.status = 403;
    error.code = 'ACCOUNT_DISABLED';
    throw error;
  }

  if (user.isLocked()) {
    await audit(AUDIT_ACTIONS.AUTH_LOGIN_FAILED, 'user', user._id, context, {
      metadata: { reason: 'account_locked', lockedUntil: user.lockedUntil }
    });
    const error = new Error('Account locked.');
    error.status = 423;
    error.code = 'ACCOUNT_LOCKED';
    throw error;
  }

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) {
    await user.incrementFailedLogin();
    await audit(AUDIT_ACTIONS.AUTH_LOGIN_FAILED, 'user', user._id, context, {
      metadata: { reason: 'invalid_password' }
    });
    const error = new Error('Invalid credentials.');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  await user.resetFailedLogin();
  user.lastLoginAt = new Date();
  await user.save();

  const provisionalSessionId = context.existingSessionId || 'pending-session';
  const provisionalSession = { sessionId: provisionalSessionId };
  const refreshToken = signRefreshToken(user, provisionalSession);
  const userSession = await sessionService.createSession(user, refreshToken, context);
  const accessToken = signAccessToken(user, userSession);
  const rotatedRefreshToken = signRefreshToken(user, userSession);
  await sessionService.rotateRefreshToken(userSession.sessionId, rotatedRefreshToken);

  const sessionUser = sessionUserFromUser(user, userSession.sessionId);

  await audit(AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED, 'user', user._id, { ...context, user: sessionUser }, {
    metadata: { email: user.email, sessionId: userSession.sessionId }
  });

  return {
    user,
    sessionUser,
    accessToken,
    refreshToken: rotatedRefreshToken,
    sessionRecord: userSession
  };
}

async function logout(user, sessionId, context = {}) {
  if (sessionId) {
    await sessionService.revokeSession(sessionId, 'logout');
  }
  await audit(AUDIT_ACTIONS.AUTH_LOGOUT, 'session', sessionId || 'session', context, {
    metadata: { userId: user?.id || user?._id || null }
  });
}

async function refreshSession(refreshToken, context = {}) {
  const payload = verifyRefreshToken(refreshToken);
  const sessionRecord = await sessionService.findSessionById(payload.sessionId);
  if (!sessionRecord || !sessionRecord.isActive || sessionRecord.revokedAt) {
    const error = new Error('Session revoked.');
    error.status = 401;
    error.code = 'SESSION_REVOKED';
    throw error;
  }
  if (sessionRecord.refreshTokenHash !== hashToken(refreshToken)) {
    const error = new Error('Invalid refresh token.');
    error.status = 401;
    error.code = 'TOKEN_INVALID';
    throw error;
  }

  const user = await User.findById(payload.sub).populate('department').select('+passwordHash');
  if (!user) {
    const error = new Error('Authentication is required.');
    error.status = 401;
    error.code = 'AUTH_REQUIRED';
    throw error;
  }

  const nextRefreshToken = signRefreshToken(user, sessionRecord);
  await sessionService.rotateRefreshToken(sessionRecord.sessionId, nextRefreshToken);
  const accessToken = signAccessToken(user, sessionRecord);
  const sessionUser = sessionUserFromUser(user, sessionRecord.sessionId);

  await audit(AUDIT_ACTIONS.AUTH_REFRESH, 'session', sessionRecord.sessionId, { ...context, user: sessionUser });

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    sessionUser
  };
}

async function requestPasswordReset(email, context = {}) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordResetTokenHash');
  if (!user) {
    return { ok: true };
  }
  const token = createPasswordReset(user);
  await user.save();
  await audit(AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED, 'user', user._id, { ...context, user }, {
    metadata: { email: user.email }
  });
  return { token, user };
}

async function resetPassword(token, password, context = {}) {
  validatePasswordStrength(password);
  const hashed = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: hashed,
    passwordResetExpiresAt: { $gt: new Date() }
  }).select('+passwordHash +passwordResetTokenHash');

  if (!user) {
    const error = new Error('Reset token is invalid or expired.');
    error.status = 400;
    error.code = 'RESET_TOKEN_INVALID';
    throw error;
  }

  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  await audit(AUDIT_ACTIONS.AUTH_PASSWORD_RESET_COMPLETED, 'user', user._id, { ...context, user });
  return user;
}

async function sendEmailVerification(userId, context = {}) {
  const user = await User.findById(userId).select('+emailVerificationTokenHash');
  if (!user) throw new Error('User not found.');
  const token = createEmailVerification(user);
  await user.save();
  await audit(AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_SENT, 'user', user._id, { ...context, user });
  return { token, user };
}

async function verifyEmailToken(token, context = {}) {
  const hashed = hashToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: hashed,
    emailVerificationExpiresAt: { $gt: new Date() }
  }).select('+emailVerificationTokenHash');
  if (!user) {
    const error = new Error('Verification token is invalid or expired.');
    error.status = 400;
    error.code = 'VERIFICATION_TOKEN_INVALID';
    throw error;
  }
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  await audit(AUDIT_ACTIONS.AUTH_EMAIL_VERIFIED, 'user', user._id, { ...context, user });
  return user;
}

async function sendOtp(userId, context = {}) {
  const user = await User.findById(userId).select('+otpHash');
  if (!user) throw new Error('User not found.');
  const otp = createOtp(user);
  await user.save();
  await audit(AUDIT_ACTIONS.AUTH_OTP_SENT, 'user', user._id, { ...context, user });
  return { otp, user };
}

async function verifyOtp(userId, otp, context = {}) {
  const user = await User.findById(userId).select('+otpHash');
  if (!user || !user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    const error = new Error('OTP is invalid or expired.');
    error.status = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }
  if (user.otpAttempts >= 5) {
    const error = new Error('OTP attempts exceeded.');
    error.status = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }
  if (hashToken(otp) !== user.otpHash) {
    user.otpAttempts += 1;
    await user.save();
    const error = new Error('OTP is invalid.');
    error.status = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }
  user.phoneVerifiedAt = new Date();
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save();
  await audit(AUDIT_ACTIONS.AUTH_OTP_VERIFIED, 'user', user._id, { ...context, user });
  return user;
}

module.exports = {
  registerInvestor,
  authenticateLocalUser,
  logout,
  refreshSession,
  requestPasswordReset,
  resetPassword,
  sendEmailVerification,
  verifyEmailToken,
  sendOtp,
  verifyOtp,
  sessionUserFromUser
};
