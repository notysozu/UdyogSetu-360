const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    sequence: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
