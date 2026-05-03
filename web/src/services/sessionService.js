const UserSession = require('../models/UserSession');
const { env } = require('../config/env');
const { createSessionId, hashToken } = require('./tokenService');

async function createSession(user, refreshToken, context = {}) {
  const sessionId = createSessionId();
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));
  return UserSession.create({
    userId: user._id,
    sessionId,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
    expiresAt,
    metadata: context.metadata || {}
  });
}

function parseDurationToMs(value) {
  if (typeof value === 'number') return value;
  const match = /^(\d+)([smhd])$/.exec(String(value));
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const map = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * map[unit];
}

function findSessionById(sessionId) {
  return UserSession.findOne({ sessionId, isActive: true, revokedAt: null }).select('+refreshTokenHash');
}

function listSessionsForUser(userId) {
  return UserSession.find({ userId, isActive: true }).sort({ lastSeenAt: -1 }).lean();
}

async function rotateRefreshToken(sessionId, refreshToken) {
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));
  return UserSession.findOneAndUpdate(
    { sessionId, isActive: true, revokedAt: null },
    {
      $set: {
        refreshTokenHash: hashToken(refreshToken),
        lastSeenAt: new Date(),
        expiresAt
      }
    },
    { new: true }
  ).select('+refreshTokenHash');
}

function revokeSession(sessionId, reason = 'logout') {
  return UserSession.findOneAndUpdate(
    { sessionId, isActive: true },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason
      }
    },
    { new: true }
  );
}

function revokeAllSessions(userId, reason = 'logout_all') {
  return UserSession.updateMany(
    { userId, isActive: true },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason
      }
    }
  );
}

module.exports = {
  createSession,
  findSessionById,
  listSessionsForUser,
  rotateRefreshToken,
  revokeSession,
  revokeAllSessions,
  parseDurationToMs
};
