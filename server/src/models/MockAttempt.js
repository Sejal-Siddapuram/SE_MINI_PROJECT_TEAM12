const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
  answers: [{ type: Number, default: null }],
  score: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 1 },
  percentage: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ studentId: 1, createdAt: -1 });
module.exports = mongoose.model('MockAttempt', schema);
