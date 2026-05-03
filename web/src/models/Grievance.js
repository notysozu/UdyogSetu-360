const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  caseId: { type: String, trim: true, index: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_review', 'resolved', 'closed'], default: 'open', index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueAt: Date,
  responses: [{
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Grievance', grievanceSchema);
