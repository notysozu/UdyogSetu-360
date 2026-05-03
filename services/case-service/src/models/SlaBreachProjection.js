const mongoose = require('mongoose');

const SlaBreachProjectionSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    universalCaseId: { type: String, trim: true, index: true },
    dueAt: { type: Date, required: true, index: true },
    breachedAt: Date,
    escalationLevel: { type: Number, default: 0, min: 0 },
    status: { type: String, default: 'open', index: true }
  },
  { timestamps: true }
);

SlaBreachProjectionSchema.index({ departmentCode: 1, status: 1, dueAt: 1 });

module.exports =
  mongoose.models.SlaBreachProjection ||
  mongoose.model('SlaBreachProjection', SlaBreachProjectionSchema);
