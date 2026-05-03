const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  family: {
    type: String,
    enum: ['pollution', 'power', 'fire', 'industrial_safety', 'labour'],
    required: true,
    index: true
  },
  slaDays: { type: Number, default: 15, min: 1 },
  adapter: {
    mode: { type: String, enum: ['mock_api', 'rest_api', 'file_drop', 'manual'], default: 'mock_api' },
    endpoint: String,
    enabled: { type: Boolean, default: true }
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
