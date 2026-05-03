const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { env } = require('../config/env');

function validatePasswordStrength(password) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (env.NODE_ENV === 'production') {
    const strongPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPattern.test(password)) {
      throw new Error('Password must include uppercase, lowercase, and a number.');
    }
  }
}

async function hashPassword(password) {
  validatePasswordStrength(password);
  return bcrypt.hash(password, 10);
}

async function comparePassword(candidate, passwordHash) {
  return bcrypt.compare(candidate, passwordHash);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
  generateOtp,
  generateSecureToken,
  hashToken
};
