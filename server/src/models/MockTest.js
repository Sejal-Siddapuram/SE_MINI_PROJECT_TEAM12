const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true },
  options: { type: [String], required: true, validate: (v) => v.length >= 2 },
  correctOption: { type: Number, required: true, min: 0, select: false,
    validate: { validator: function (v) { return Number.isInteger(v) && v < this.options.length; } } },
}, { _id: false });

const mockTestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  seedKey: { type: String },
  questions: { type: [questionSchema], required: true, validate: (v) => v.length > 0 },
}, { timestamps: true });
mockTestSchema.index({ seedKey: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('MockTest', mockTestSchema);
