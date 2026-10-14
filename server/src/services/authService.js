const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AppError = require('../utils/AppError');
const ROLES = require('../utils/roles');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const SALT_ROUNDS = 10;

/** Salted one-way hash (SR-01). Exported so other modules create users the same way. */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Shape of a user that is safe to send to the client */
function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
  };
}

/**
 * FR-01: register a new student with college-issued credentials.
 * Creates the User (role Student) and the linked StudentProfile.
 */
async function registerStudent({ name, usn, email, password, branch, semester }) {
  const normalizedEmail = email.toLowerCase();
  const normalizedUsn = usn.toUpperCase();

  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists.', [
      { field: 'email', message: 'This email is already registered.' },
    ]);
  }
  if (await StudentProfile.exists({ usn: normalizedUsn })) {
    throw new AppError(409, 'USN_EXISTS', 'An account with this USN already exists.', [
      { field: 'usn', message: 'This USN is already registered.' },
    ]);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: ROLES.STUDENT,
  });

  try {
    await StudentProfile.create({ userId: user._id, usn: normalizedUsn, branch, semester });
  } catch (err) {
    // Keep data consistent: no User without its StudentProfile
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  return { userId: user._id.toString(), role: user.role };
}

/**
 * FR-02: log in with email + password and receive a signed JWT.
 * The same message is used for "unknown email" and "wrong password"
 * so attackers cannot discover which emails are registered.
 */
async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordOk) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const token = jwt.sign({ sub: user._id.toString(), role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return { token, expiresIn: JWT_EXPIRES_IN, user: toPublicUser(user) };
}

/** Returns the logged-in user's details (used by the client to restore a session) */
async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
  return toPublicUser(user);
}

module.exports = { hashPassword, toPublicUser, registerStudent, login, getCurrentUser };
