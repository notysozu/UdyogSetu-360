const { env } = require('../config/env');
const { generateSecureToken, hashToken, generateOtp } = require('./passwordService');

function buildExpiry(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function createPasswordReset(user) {
  const token = generateSecureToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = buildExpiry(env.PASSWORD_RESET_EXPIRES_MINUTES);
  return token;
}

function createEmailVerification(user) {
  const token = generateSecureToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = buildExpiry(env.EMAIL_VERIFICATION_EXPIRES_MINUTES);
  return token;
}

function createOtp(user) {
  const otp = generateOtp();
  user.otpHash = hashToken(otp);
  user.otpExpiresAt = buildExpiry(env.OTP_EXPIRES_MINUTES);
  user.otpAttempts = 0;
  return otp;
}

module.exports = {
  createPasswordReset,
  createEmailVerification,
  createOtp
};
