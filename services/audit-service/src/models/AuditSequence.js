const mongoose = require('mongoose');

const AuditSequenceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true, default: 0 }
  },
  { timestamps: false }
);

module.exports = mongoose.models.AuditSequence || mongoose.model('AuditSequence', AuditSequenceSchema);
