const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const { createStudent, createRecruiter, createAdmin, loginAs, auth } = require('./helpers/factories');

const validStudent = (overrides = {}) => ({
  name: 'Asha Rao',
  usn: 'PES1UG24CS101',
  email: 'asha@pesu.pes.edu',
  password: 'Asha12345',
  branch: 'CSE',
  semester: 5,
  ...overrides,
});

describe('FR-01 Student registration', () => {
  it('IT-AUTH-01 (TC-AUTH-01): registers a student with valid details and links a StudentProfile', async () => {
    const res = await request(app).post('/api/auth/register').send(validStudent());

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('Student');

    const user = await User.findById(res.body.data.userId);
    const profile = await StudentProfile.findOne({ userId: user._id });
    expect(user.email).toBe('asha@pesu.pes.edu');
    expect(profile.usn).toBe('PES1UG24CS101');
    expect(profile.semester).toBe(5);
  });

  it('IT-AUTH-02 (TC-AUTH-01): stores email in lower case and USN in upper case', async () => {
    await request(app).post('/api/auth/register').send(validStudent({ email: 'Asha@PESU.pes.edu', usn: 'pes1ug24cs101' }));
    const user = await User.findOne({ email: 'asha@pesu.pes.edu' });
    expect(user).not.toBeNull();
    expect(await StudentProfile.exists({ usn: 'PES1UG24CS101' })).toBeTruthy();
  });

  it('IT-AUTH-03 (TC-AUTH-02): rejects an email that is already registered, without creating a second record', async () => {
    await request(app).post('/api/auth/register').send(validStudent());
    const res = await request(app).post('/api/auth/register').send(validStudent({ usn: 'PES1UG24CS102' }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
    expect(await User.countDocuments({ email: 'asha@pesu.pes.edu' })).toBe(1);
  });

  it('IT-AUTH-04 (TC-AUTH-02): rejects a USN that is already registered', async () => {
    await request(app).post('/api/auth/register').send(validStudent());
    const res = await request(app).post('/api/auth/register').send(validStudent({ email: 'other@pesu.pes.edu' }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USN_EXISTS');
  });

  it.each([
    ['IT-AUTH-05', 'missing name', { name: '' }, 'name'],
    ['IT-AUTH-06', 'invalid USN format', { usn: 'ABC123' }, 'usn'],
    ['IT-AUTH-07', 'invalid email', { email: 'not-an-email' }, 'email'],
    ['IT-AUTH-08', 'password shorter than 8', { password: 'Ab1' }, 'password'],
    ['IT-AUTH-09', 'password without a digit', { password: 'abcdefgh' }, 'password'],
    ['IT-AUTH-10', 'semester out of range', { semester: 9 }, 'semester'],
  ])('%s (TC-AUTH-01): rejects %s with 400 VALIDATION_ERROR', async (_id, _label, change, field) => {
    const res = await request(app).post('/api/auth/register').send(validStudent(change));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
  });
});

describe('FR-02 Login and role-based access', () => {
  it('IT-AUTH-11 (TC-AUTH-03): logs in with correct credentials and returns a JWT with role and expiry', async () => {
    const { user, password } = await createStudent();
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: user._id.toString(), role: 'Student' });
    const payload = jwt.decode(res.body.data.token);
    expect(payload.role).toBe('Student');
    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(payload.jti).toBeDefined();
  });

  it('IT-AUTH-12 (TC-AUTH-04): gives the same 401 message for a wrong password and an unknown email', async () => {
    const { user } = await createStudent();
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Wrong1234' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'nobody@test.edu', password: 'Wrong1234' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('IT-AUTH-13 (TC-AUTH-04): rejects a login request with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it.each([
    ['IT-AUTH-14', 'Student', createStudent],
    ['IT-AUTH-15', 'Recruiter', createRecruiter],
    ['IT-AUTH-16', 'Admin', createAdmin],
  ])('%s (TC-AUTH-03): GET /api/auth/me returns the logged-in %s', async (_id, role, create) => {
    const { user, password } = await create();
    const token = await loginAs(user.email, password);
    const res = await request(app).get('/api/auth/me').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe(role);
  });

  it('IT-AUTH-17: GET /api/auth/me without a token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('IT-AUTH-18: GET /api/auth/me returns 401 if the account was deleted after login', async () => {
    const { user, password } = await createStudent();
    const token = await loginAs(user.email, password);
    await User.deleteOne({ _id: user._id });

    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(401);
  });

  it('IT-AUTH-19: only a Student can open the student profile (server-side RBAC, SR-03)', async () => {
    const recruiter = await createRecruiter();
    const admin = await createAdmin();
    const recruiterToken = await loginAs(recruiter.user.email, recruiter.password);
    const adminToken = await loginAs(admin.user.email, admin.password);

    expect((await request(app).get('/api/profile').set(auth(recruiterToken))).status).toBe(403);
    expect((await request(app).get('/api/profile').set(auth(adminToken))).status).toBe(403);
  });
});
