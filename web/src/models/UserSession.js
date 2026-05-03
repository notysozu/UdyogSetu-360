const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  refreshTokenHash: { type: String, required: true, select: false },
  userAgent: String,
  ipAddress: String,
  lastSeenAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: Date,
  revokeReason: String,
  isActive: { type: Boolean, default: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

userSessionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.models.UserSession || mongoose.model('UserSession', userSessionSchema);
