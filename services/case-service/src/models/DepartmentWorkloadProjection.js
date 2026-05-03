const mongoose = require('mongoose');

const officerWorkloadSchema = new mongoose.Schema(
  {
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officerName: String,
    pendingCount: Number,
    overdueCount: Number
  },
  { _id: false }
);

const DepartmentWorkloadProjectionSchema = new mongoose.Schema(
  {
    departmentCode: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    pendingCount: { type: Number, default: 0, min: 0 },
    approvedCount: { type: Number, default: 0, min: 0 },
    rejectedCount: { type: Number, default: 0, min: 0 },
    overdueCount: { type: Number, default: 0, min: 0 },
    averageTurnaroundHours: { type: Number, default: 0, min: 0 },
    avgTurnaroundHours: { type: Number, default: 0, min: 0 },
    medianTurnaroundHours: { type: Number, default: 0, min: 0 },
    certificateIssuedCount: { type: Number, default: 0, min: 0 },
    grievanceCount: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    officerWorkloads: [officerWorkloadSchema]
  },
  { timestamps: true }
);

DepartmentWorkloadProjectionSchema.index({ departmentCode: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.DepartmentWorkloadProjection ||
  mongoose.model('DepartmentWorkloadProjection', DepartmentWorkloadProjectionSchema);
