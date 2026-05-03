const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  kind: { type: String, enum: ['department_adapter', 'digilocker', 'sms', 'email', 'n8n', 'ai_service'], required: true },
  status: { type: String, enum: ['active', 'disabled', 'degraded'], default: 'active' },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastCheckedAt: Date,
  lastError: String
}, { timestamps: true });

module.exports = mongoose.model('Integration', integrationSchema);
