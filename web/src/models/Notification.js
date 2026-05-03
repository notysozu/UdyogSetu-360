const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  channel: { type: String, enum: ['in_app', 'email', 'sms'], default: 'in_app' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  caseId: { type: String, index: true },
  readAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
