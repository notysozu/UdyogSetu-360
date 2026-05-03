const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: true, unique: true, trim: true, index: true },
  caseId: { type: String, required: true, trim: true, index: true },
  verificationToken: { type: String, required: true, unique: true, trim: true, index: true },
  departmentName: { type: String, trim: true },
  holderName: { type: String, trim: true },
  enterpriseName: { type: String, trim: true },
  issuedAt: Date,
  expiresAt: Date,
  status: { type: String, enum: ['valid', 'revoked', 'expired'], default: 'valid', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
