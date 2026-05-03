const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  topic: { type: String, enum: ['general', 'feedback', 'helpdesk', 'technical', 'department'], default: 'general', index: true },
  message: { type: String, required: true, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['new', 'in_review', 'closed'], default: 'new', index: true }
}, { timestamps: true });

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
