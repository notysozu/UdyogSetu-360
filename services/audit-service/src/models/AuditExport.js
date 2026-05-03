const mongoose = require('mongoose');

const AuditExportSchema = new mongoose.Schema(
  {
    exportId: { type: String, required: true, unique: true, index: true },
    requestedBy: String,
    format: String,
    filter: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, default: 'completed', index: true },
    rowCount: Number,
    filePath: String,
    downloadUrl: String,
    includeSensitive: { type: Boolean, default: false },
    integrityVerified: { type: Boolean, default: false },
    failureReason: String,
    correlationId: String,
    createdAt: Date,
    completedAt: Date
  },
  { timestamps: false }
);

module.exports = mongoose.models.AuditExport || mongoose.model('AuditExport', AuditExportSchema);
