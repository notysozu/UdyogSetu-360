const mongoose = require('mongoose');
const {
  createOperationalSchema,
  DEPARTMENT_CODE_VALUES,
  INTEGRATION_TYPE_VALUES
} = require('../../../../packages/shared/src');

const escalationSchema = new mongoose.Schema(
  {
    level: { type: Number, min: 1, required: true },
    roleCode: { type: String, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    thresholdHours: { type: Number, min: 0 },
    notifyChannels: [{ type: String, trim: true }]
  },
  { _id: false }
);

const slaDefaultSchema = new mongoose.Schema(
  {
    taskType: { type: String, trim: true },
    dueInHours: { type: Number, min: 1 },
    warningBeforeHours: { type: Number, min: 0 }
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    email: String,
    phone: String,
    address: String
  },
  { _id: false }
);

const DepartmentSchema = createOperationalSchema({
  code: { type: String, required: true, enum: DEPARTMENT_CODE_VALUES, index: true },
  name: { type: String, required: true, trim: true },
  shortName: { type: String, trim: true },
  description: { type: String, trim: true },
  departmentFamily: { type: String, enum: DEPARTMENT_CODE_VALUES, required: true },
  nodalOfficerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalationMatrix: [escalationSchema],
  slaDefaults: [slaDefaultSchema],
  integrationMode: { type: String, required: true, enum: INTEGRATION_TYPE_VALUES, default: 'rest_api', index: true },
  contact: contactSchema,
  isActive: { type: Boolean, default: true, index: true }
});

DepartmentSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

module.exports = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
