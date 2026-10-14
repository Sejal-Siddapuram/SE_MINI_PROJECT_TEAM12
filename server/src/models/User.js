const mongoose = require('mongoose');
const ROLES = require('../utils/roles');

/**
 * User (Base) - SRS Section 14.1
 * One collection for every role. Students get an extra StudentProfile document;
 * recruiters additionally store the company they represent.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false -> the hash is never returned by queries unless explicitly asked for
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true },
    company: { type: String, trim: true, maxlength: 120 }, // Recruiters only
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('User', userSchema);
