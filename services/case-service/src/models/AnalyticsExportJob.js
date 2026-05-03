const mongoose = require('mongoose');

const AnalyticsExportJobSchema = new mongoose.Schema(
  {
    exportId: { type: String, required: true, unique: true, trim: true },
    requestedBy: { type: String, required: true, trim: true },
    requestedByRole: { type: String, required: true, trim: true },
    exportType: { type: String, required: true, trim: true },
    format: { type: String, enum: ['csv', 'json', 'xlsx', 'html_print'], required: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed', 'expired'], default: 'queued' },
    rowCount: { type: Number, default: 0, min: 0 },
    filePath: { type: String, default: null },
    downloadUrl: { type: String, default: null },
    failureReason: { type: String, default: null },
    correlationId: { type: String, default: null },
    completedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'analytics_export_jobs' }
);

AnalyticsExportJobSchema.index({ requestedBy: 1, createdAt: -1 });
AnalyticsExportJobSchema.index({ status: 1, createdAt: -1 });
AnalyticsExportJobSchema.index({ exportType: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsExportJob', AnalyticsExportJobSchema);
