const mongoose = require('mongoose');

/**
 * Student Profile - SRS Section 14.2
 * Created together with the User at registration (FR-01).
 * Skills and resume are filled in later from the profile page (FR-03).
 */
const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    usn: { type: String, required: true, unique: true, uppercase: true, trim: true },
    branch: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    skills: { type: [String], default: [] },
    resumeUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
