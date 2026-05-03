const mongoose = require('mongoose');

const DocumentDefectProjectionSchema = new mongoose.Schema(
  {
    defectId: { type: String, required: true, unique: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true, index: true },
    documentType: { type: String, index: true },
    departmentCode: { type: String, index: true },
    defectCategory: {
      type: String,
      enum: [
        'missing_document',
        'unreadable_document',
        'expired_document',
        'mismatch',
        'invalid_format',
        'incomplete_details',
        'unsigned',
        'wrong_document_type',
        'duplicate_document',
        'other'
      ],
      default: 'other'
    },
    defectReason: { type: String, default: '' },
    occurrenceCount: { type: Number, default: 0 },
    affectedCaseCount: { type: Number, default: 0 },
    rejectionRate: { type: Number, default: 0 },
    averageCorrectionTimeHours: { type: Number, default: 0 },
    repeatedByOrganisationCount: { type: Number, default: 0 },
    trendDirection: { type: String, default: 'stable' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    examples: [{ type: String }],
    recommendedAction: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

DocumentDefectProjectionSchema.index({ documentType: 1, departmentCode: 1, periodEnd: -1 });
DocumentDefectProjectionSchema.index({ defectCategory: 1, occurrenceCount: -1 });
DocumentDefectProjectionSchema.index({ severity: 1, periodEnd: -1 });

module.exports =
  mongoose.models.DocumentDefectProjection ||
  mongoose.model('DocumentDefectProjection', DocumentDefectProjectionSchema);
