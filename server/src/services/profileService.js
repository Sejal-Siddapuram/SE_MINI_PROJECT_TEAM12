const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AppError = require('../utils/AppError');
const { UPLOAD_DIR } = require('../middleware/resumeUpload');

/** Shape of a profile that is safe to send to the client */
function toPublicProfile(user, profile) {
  return {
    name: user.name,
    email: user.email,
    usn: profile.usn,
    branch: profile.branch,
    semester: profile.semester,
    cgpa: profile.cgpa ?? null,
    skills: profile.skills,
    hasResume: Boolean(profile.resumeUrl),
    resumeOriginalName: profile.resumeOriginalName || null,
    resumeUploadedAt: profile.resumeUploadedAt || null,
    isComplete: Boolean(profile.branch && profile.semester && profile.skills.length > 0 && profile.resumeUrl),
  };
}

async function loadOwn(userId) {
  const [user, profile] = await Promise.all([User.findById(userId), StudentProfile.findOne({ userId })]);
  if (!user || !profile) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
  return { user, profile };
}

/** FR-03: the logged-in student's own profile */
async function getProfile(userId) {
  const { user, profile } = await loadOwn(userId);
  return toPublicProfile(user, profile);
}

/** FR-03: update name and academic details. USN and email cannot be changed here. */
async function updateProfile(userId, { name, branch, semester, cgpa, skills }) {
  const { user, profile } = await loadOwn(userId);

  if (name !== undefined) user.name = name;
  if (branch !== undefined) profile.branch = branch;
  if (semester !== undefined) profile.semester = semester;
  if (cgpa !== undefined) profile.cgpa = cgpa === null ? undefined : cgpa;
  if (skills !== undefined) {
    // remove blanks and duplicates (case-insensitive), keep the first spelling
    const seen = new Set();
    profile.skills = skills
      .map((s) => s.trim())
      .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
  }

  await Promise.all([user.save(), profile.save()]);
  return toPublicProfile(user, profile);
}

/** FR-03: store a new resume (already validated by the upload middleware) and remove the old file */
async function saveResume(userId, file) {
  const { user, profile } = await loadOwn(userId);
  const oldFile = profile.resumeUrl;

  profile.resumeUrl = file.filename;
  profile.resumeOriginalName = file.originalname;
  profile.resumeUploadedAt = new Date();
  await profile.save();

  if (oldFile) fs.rm(path.join(UPLOAD_DIR, oldFile), { force: true }, () => {});
  return toPublicProfile(user, profile);
}

/** FR-03: path of the student's own resume (owner-only access, SAD 3.9) */
async function getResumeFile(userId) {
  const { profile } = await loadOwn(userId);
  const filePath = profile.resumeUrl && path.join(UPLOAD_DIR, profile.resumeUrl);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new AppError(404, 'RESUME_NOT_FOUND', 'No resume has been uploaded yet.');
  }
  return { filePath, downloadName: profile.resumeOriginalName || 'resume.pdf' };
}

module.exports = { getProfile, updateProfile, saveResume, getResumeFile };
