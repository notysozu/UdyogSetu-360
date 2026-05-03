const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { hashToken } = require('./passwordService');

function buildClaims(user, session, tokenType) {
  return {
    sub: user._id.toString(),
    email: user.email,
    roles: user.roles || [user.role],
    primaryRole: user.primaryRole || user.role,
    permissions: user.permissions || [],
    organisationId: user.organisationId?.toString?.() || null,
    departmentId: user.departmentId?.toString?.() || user.department?.toString?.() || null,
    investorId: user.investorId?.toString?.() || null,
    tokenType,
    sessionId: session?.sessionId || null
  };
}

function signAccessToken(user, session) {
  return jwt.sign(buildClaims(user, session, 'access'), env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

function signRefreshToken(user, session) {
  return jwt.sign(buildClaims(user, session, 'refresh'), env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

function signServiceToken(serviceName) {
  return jwt.sign({
    sub: serviceName,
    roles: ['system'],
    primaryRole: 'system',
    permissions: ['system.internal_call'],
    tokenType: 'service',
    serviceName
  }, env.SERVICE_JWT_SECRET, {
    expiresIn: '15m',
    issuer: env.JWT_ISSUER,
    audience: 'udyogsetu-360-internal'
  });
}

function verifyServiceToken(token) {
  return jwt.verify(token, env.SERVICE_JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: 'udyogsetu-360-internal'
  });
}

function createSessionId() {
  return crypto.randomUUID();
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signServiceToken,
  verifyServiceToken,
  hashToken,
  generateSecureToken: require('./passwordService').generateSecureToken,
  createSessionId
};
