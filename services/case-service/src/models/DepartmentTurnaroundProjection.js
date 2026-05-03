const mongoose = require('mongoose');

const DepartmentTurnaroundProjectionSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true, index: true },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 },
    approvedTasks: { type: Number, default: 0 },
    rejectedTasks: { type: Number, default: 0 },
    returnedTasks: { type: Number, default: 0 },
    averageTurnaroundHours: { type: Number, default: 0 },
    medianTurnaroundHours: { type: Number, default: 0 },
    p75TurnaroundHours: { type: Number, default: 0 },
    p90TurnaroundHours: { type: Number, default: 0 },
    slaWarningCount: { type: Number, default: 0 },
    slaBreachCount: { type: Number, default: 0 },
    slaComplianceRate: { type: Number, default: 0 },
    ageingBuckets: { type: mongoose.Schema.Types.Mixed, default: {} },
    stageBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    bottleneckScore: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

DepartmentTurnaroundProjectionSchema.index({ departmentCode: 1, periodStart: 1, periodEnd: 1 }, { unique: true });
DepartmentTurnaroundProjectionSchema.index({ bottleneckScore: -1, periodEnd: -1 });
DepartmentTurnaroundProjectionSchema.index({ slaComplianceRate: -1, periodEnd: -1 });

module.exports =
  mongoose.models.DepartmentTurnaroundProjection ||
  mongoose.model('DepartmentTurnaroundProjection', DepartmentTurnaroundProjectionSchema);
