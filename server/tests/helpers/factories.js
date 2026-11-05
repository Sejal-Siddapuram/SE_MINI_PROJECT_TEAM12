/**
 * Shared test helpers: create users of each role and log them in.
 * Every module's tests can use these instead of repeating setup code.
 *
 *   const { createStudent, loginAs, auth } = require('./helpers/factories');
 *   const { user, password } = await createStudent();
 *   const token = await loginAs(user.email, password);
 *   await request(app).get('/api/profile').set(auth(token));
 */
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const StudentProfile = require('../../src/models/StudentProfile');
const { hashPassword } = require('../../src/services/authService');
const ROLES = require('../../src/utils/roles');

const DEFAULT_PASSWORD = 'Passw0rd123';
let counter = 0;
const next = () => {
  counter += 1;
  return counter;
};

async function createUser(role, overrides = {}) {
  const n = next();
  const password = overrides.password || DEFAULT_PASSWORD;
  const user = await User.create({
    name: overrides.name || `${role} ${n}`,
    email: overrides.email || `${role.toLowerCase()}${n}@test.edu`,
    passwordHash: await hashPassword(password),
    role,
    company: overrides.company,
  });
  return { user, password };
}

async function createStudent(overrides = {}) {
  const result = await createUser(ROLES.STUDENT, overrides);
  const n = String(next()).padStart(3, '0');
  result.profile = await StudentProfile.create({
    userId: result.user._id,
    usn: overrides.usn || `PES1UG24CS${n}`,
    branch: overrides.branch || 'CSE',
    semester: overrides.semester || 5,
    skills: overrides.skills || [],
  });
  return result;
}

const createRecruiter = (overrides = {}) =>
  createUser(ROLES.RECRUITER, { company: 'Test Company', ...overrides });

const createAdmin = (overrides = {}) => createUser(ROLES.ADMIN, overrides);

/** Logs in through the real API and returns the JWT */
async function loginAs(email, password = DEFAULT_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status}`);
  return res.body.data.token;
}

/** Authorization header for supertest: .set(auth(token)) */
const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = {
  DEFAULT_PASSWORD,
  createStudent,
  createRecruiter,
  createAdmin,
  loginAs,
  auth,
};
