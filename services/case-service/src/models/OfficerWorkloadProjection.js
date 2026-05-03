const mongoose = require('mongoose');

const OfficerWorkloadProjectionSchema = new mongoose.Schema(
  {
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    departmentCode: { type: String, required: true, trim: true },
    officerUserId: { type: String, required: true, trim: true },
    officerDisplayName: { type: String, default: null, trim: true },
    officerRole: { type: String, default: 'department_officer', trim: true },
    assignedTaskCount: { type: Number, default: 0, min: 0 },
    activeTaskCount: { type: Number, default: 0, min: 0 },
    completedTaskCount: { type: Number, default: 0, min: 0 },
    overdueTaskCount: { type: Number, default: 0, min: 0 },
    averageHandlingHours: { type: Number, default: 0, min: 0 },
    approvalCount: { type: Number, default: 0, min: 0 },
    rejectionCount: { type: Number, default: 0, min: 0 },
    queryRaisedCount: { type: Number, default: 0, min: 0 },
    inspectionHandledCount: { type: Number, default: 0, min: 0 },
    workloadScore: { type: Number, default: 0, min: 0, max: 100 },
    imbalanceFlag: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'officer_workload_projections' }
);

OfficerWorkloadProjectionSchema.index({ departmentCode: 1, periodEnd: -1 });
OfficerWorkloadProjectionSchema.index({ officerUserId: 1, periodEnd: -1 });
OfficerWorkloadProjectionSchema.index({ workloadScore: -1, periodEnd: -1 });
OfficerWorkloadProjectionSchema.index({ imbalanceFlag: 1, departmentCode: 1 });

module.exports = mongoose.model('OfficerWorkloadProjection', OfficerWorkloadProjectionSchema);
