const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Application = require('../src/models/Application');
const AuditLog = require('../src/models/AuditLog');
const { createStudent, createRecruiter, createAdmin, loginAs, auth } = require('./helpers/factories');

async function session(factory = createAdmin) {
  const { user, password } = await factory();
  return { user, token: await loginAs(user.email, password) };
}
async function listing(overrides = {}) {
  const { user } = await createRecruiter();
  return Listing.create({ recruiterId: user._id, company: 'Example', title: 'Engineer', role: 'Developer',
    location: 'Bengaluru', description: 'Build software', deadline: new Date('2099-01-01'), ...overrides });
}
const onboarding = { name: 'New Recruiter', email: 'new@example.com', company: 'Example', password: 'Recruit123' };

describe('FR-10 adminService and SR-06 audit trail', () => {
  it('IT-ADM-20 (TC-SEC-06): records five failed logins and an admin action with actor and IP', async () => {
    const { user, token } = await session();
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login')
        .send({ email: user.email, password: 'Wrong1234' });
      expect(res.status).toBe(401);
    }
    expect((await request(app).post('/api/admin/recruiters').set(auth(token)).send(onboarding)).status).toBe(201);
    const logs = await AuditLog.find().sort({ createdAt: 1 });
    expect(logs.filter((entry) => entry.action === 'LOGIN_FAILED')).toHaveLength(5);
    expect(logs.filter((entry) => entry.action === 'ONBOARD_RECRUITER')).toHaveLength(1);
    for (const entry of logs) {
      expect(entry.userId.toString()).toBe(user.id);
      expect(entry.ip).toBeTruthy();
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(JSON.stringify(entry)).not.toContain('Wrong1234');
    }
  });
  it('IT-ADM-01 (TC-ADM-01): onboards a recruiter, hashes the password and records the admin action', async () => {
    const { user, token } = await session();
    const res = await request(app).post('/api/admin/recruiters').set(auth(token)).send(onboarding);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: onboarding.email, role: 'Recruiter', company: 'Example' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|Recruit123/);
    const saved = await User.findOne({ email: onboarding.email }).select('+passwordHash');
    expect(saved.passwordHash).toMatch(/^\$2/);
    expect(await loginAs(onboarding.email, onboarding.password)).toEqual(expect.any(String));
    const audit = await AuditLog.findOne({ action: 'ONBOARD_RECRUITER' });
    expect(audit).toMatchObject({ userId: user._id, targetId: saved._id, targetType: 'User', outcome: 'SUCCESS' });
    expect(audit.ip).toBeTruthy();
  });
  it('IT-ADM-02 (TC-ADM-01): rejects duplicate emails regardless of case without a success audit', async () => {
    const { token } = await session();
    await createRecruiter({ email: onboarding.email });
    const res = await request(app).post('/api/admin/recruiters').set(auth(token)).send({ ...onboarding, email: 'NEW@EXAMPLE.COM' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
    expect(await AuditLog.countDocuments({ action: 'ONBOARD_RECRUITER' })).toBe(0);
  });
  it.each([
    ['03', { name: ' ' }], ['04', { email: 'invalid' }],
    ['05', { company: '' }], ['06', { password: 'short' }],
  ])('IT-ADM-%s (TC-ADM-01): rejects invalid onboarding fields', async (_id, updates) => {
    const { token } = await session();
    const res = await request(app).post('/api/admin/recruiters').set(auth(token)).send({ ...onboarding, ...updates });
    expect(res.status).toBe(400);
    expect(await User.countDocuments({ email: onboarding.email })).toBe(0);
  });
  it('IT-ADM-07 (TC-ADM-01): lists only recruiters newest first', async () => {
    const { token } = await session();
    const older = await createRecruiter();
    await User.updateOne({ _id: older.user._id }, { $set: { createdAt: new Date('2020-01-01') } }, { timestamps: false });
    const newer = await createRecruiter();
    await createStudent();
    const res = await request(app).get('/api/admin/recruiters').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r.id)).toEqual([newer.user.id, older.user.id]);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
  it('IT-ADM-08 (TC-ADM-02): lists all moderation states or filters one state', async () => {
    const { token } = await session();
    const pending = await listing();
    await listing({ approvalStatus: 'Approved' });
    const all = await request(app).get('/api/admin/listings').set(auth(token));
    const filtered = await request(app).get('/api/admin/listings?approvalStatus=Pending').set(auth(token));
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(2);
    expect(filtered.body.data.map((l) => l._id)).toEqual([pending.id]);
    expect(filtered.body.data[0].recruiterId.email).toBeTruthy();
  });
  it.each(['approve', 'remove'])('IT-ADM-09-%s (TC-ADM-02): moderates and audits a listing', async (action) => {
    const { user, token } = await session();
    const item = await listing();
    const res = await request(app).patch('/api/admin/listings/' + item.id + '/moderation')
      .set(auth(token)).send({ action, reason: 'Outdated' });
    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe(action === 'approve' ? 'Approved' : 'Removed');
    const audit = await AuditLog.findOne({ action: action.toUpperCase() + '_LISTING' });
    expect(audit).toMatchObject({ userId: user._id, targetId: item._id, targetType: 'Listing' });
    if (action === 'remove') expect(audit.details).toContain('Outdated');
  });
  it('IT-ADM-21 (TC-ADM-02): students see approved listings but not removed listings', async () => {
    const { token: adminToken } = await session();
    const { token: studentToken } = await session(createStudent);
    const approved = await listing({ title: 'Approved role', status: 'Published' });
    const removed = await listing({ title: 'Removed role', status: 'Published', approvalStatus: 'Approved' });
    for (const [item, action] of [[approved, 'approve'], [removed, 'remove']]) {
      expect((await request(app).patch('/api/admin/listings/' + item.id + '/moderation')
        .set(auth(adminToken)).send({ action })).status).toBe(200);
    }
    const search = await request(app).get('/api/listings').set(auth(studentToken));
    expect(search.status).toBe(200);
    expect(search.body.data.items.map((item) => item.title)).toEqual(['Approved role']);
    expect(await AuditLog.countDocuments({ action: { $in: ['APPROVE_LISTING', 'REMOVE_LISTING'] } })).toBe(2);
  });
  it('IT-ADM-10 (TC-ADM-02): removes without a reason', async () => {
    const { token } = await session(); const item = await listing();
    const res = await request(app).patch('/api/admin/listings/' + item.id + '/moderation').set(auth(token)).send({ action: 'remove' });
    expect(res.status).toBe(200);
    expect((await AuditLog.findOne({ action: 'REMOVE_LISTING' })).details).toBe(item.title);
  });
  it('IT-ADM-11 (TC-ADM-02): edits allowed fields and ignores protected and non-string fields', async () => {
    const { token } = await session(); const item = await listing();
    const res = await request(app).patch('/api/admin/listings/' + item.id + '/moderation').set(auth(token))
      .send({ action: 'edit', updates: { title: 'Corrected', location: 123, company: 'Forged', status: 'Published' } });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Corrected', location: item.location, company: item.company, status: 'Draft' });
    expect((await AuditLog.findOne({ action: 'EDIT_LISTING' })).details).toContain('edited: title');
  });
  it.each([undefined, { title: 'Engineer' }])('IT-ADM-12 (TC-ADM-02): records a no-change edit (%j)', async (updates) => {
    const { token } = await session(); const item = await listing();
    const res = await request(app).patch('/api/admin/listings/' + item.id + '/moderation').set(auth(token)).send({ action: 'edit', updates });
    expect(res.status).toBe(200);
    expect((await AuditLog.findOne({ action: 'EDIT_LISTING' })).details).toContain('no changes');
  });
  it('IT-ADM-13 (TC-ADM-02): returns 404 for a missing listing', async () => {
    const { token } = await session();
    const res = await request(app).patch('/api/admin/listings/' + new mongoose.Types.ObjectId() + '/moderation').set(auth(token)).send({ action: 'approve' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('LISTING_NOT_FOUND');
  });
  it.each([
    ['14', 'not-an-id', { action: 'approve' }],
    ['15', new mongoose.Types.ObjectId().toString(), { action: 'delete' }],
    ['16', new mongoose.Types.ObjectId().toString(), { action: 'edit', updates: { title: ' ' } }],
  ])('IT-ADM-%s (TC-ADM-02): rejects invalid moderation input', async (_id, id, body) => {
    const { token } = await session();
    expect((await request(app).patch('/api/admin/listings/' + id + '/moderation').set(auth(token)).send(body)).status).toBe(400);
  });
  it('IT-ADM-17 (TC-ADM-02): rejects invalid moderation filters', async () => {
    const { token } = await session();
    expect((await request(app).get('/api/admin/listings?approvalStatus=Invalid').set(auth(token))).status).toBe(400);
  });
  it('IT-ADM-18 (TC-SEC-06): returns the newest ten audit entries with the actor', async () => {
    const { user, token } = await session();
    await AuditLog.insertMany(Array.from({ length: 12 }, (_, i) => ({
      userId: user._id, action: 'TEST_' + i, createdAt: new Date(2020, 0, i + 1),
    })));
    const res = await request(app).get('/api/admin/audit-logs').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.data.map((l) => l.action)).toEqual(Array.from({ length: 10 }, (_, i) => 'TEST_' + (11 - i)));
    expect(res.body.data[0].userId.email).toBe(user.email);
  });
  it.each([createStudent, createRecruiter])('IT-ADM-19 (TC-SEC-03): blocks every admin operation for %p', async (factory) => {
    const { token } = await session(factory);
    for (const [method, url, body] of [
      ['post', '/api/admin/recruiters', onboarding], ['get', '/api/admin/recruiters'],
      ['get', '/api/admin/listings'], ['get', '/api/admin/analytics'], ['get', '/api/admin/audit-logs'],
      ['patch', '/api/admin/listings/' + new mongoose.Types.ObjectId() + '/moderation', { action: 'approve' }],
    ]) {
      const res = await request(app)[method](url).set(auth(token)).send(body);
      expect(res.status).toBe(403);
    }
    expect(await AuditLog.countDocuments({})).toBe(0);
  });
});

describe('FR-11 placement analytics', () => {
  it('IT-ANL-01 (TC-ADM-03): returns four zero totals for an empty portal', async () => {
    const { token } = await session();
    const res = await request(app).get('/api/admin/analytics').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ students: 0, listings: 0, applications: 0, selections: 0 });
  });
  it('IT-ANL-02 (TC-ADM-03): counts student users and excludes recruiters and admins', async () => {
    const { token } = await session(); await createStudent(); await createStudent(); await createRecruiter();
    expect((await request(app).get('/api/admin/analytics').set(auth(token))).body.data.students).toBe(2);
  });
  it('IT-ANL-03 (TC-ADM-03): counts every listing including draft, closed and removed', async () => {
    const { token } = await session();
    await listing(); await listing({ status: 'Closed' }); await listing({ approvalStatus: 'Removed' });
    expect((await request(app).get('/api/admin/analytics').set(auth(token))).body.data.listings).toBe(3);
  });
  it('IT-ANL-04 (TC-ADM-03): counts all applications but only Selected as selections', async () => {
    const { token } = await session(); const { user } = await createStudent();
    for (const status of ['Applied', 'Shortlisted', 'Rejected', 'Selected']) {
      const item = await listing(); await Application.create({ studentId: user._id, listingId: item._id, status });
    }
    const res = await request(app).get('/api/admin/analytics').set(auth(token));
    expect(res.body.data).toEqual({ students: 1, listings: 4, applications: 4, selections: 1 });
  });
  it('IT-ANL-05 (TC-ADM-03): refreshes after a status change without cached totals', async () => {
    const { token } = await session(); const { user } = await createStudent(); const item = await listing();
    const application = await Application.create({ studentId: user._id, listingId: item._id });
    expect((await request(app).get('/api/admin/analytics').set(auth(token))).body.data.selections).toBe(0);
    application.status = 'Selected'; await application.save();
    expect((await request(app).get('/api/admin/analytics').set(auth(token))).body.data.selections).toBe(1);
  });
  it('IT-ANL-06 (TC-ADM-03): counts selected applications rather than distinct students', async () => {
    const { token } = await session(); const { user } = await createStudent();
    for (let i = 0; i < 2; i++) {
      const item = await listing(); await Application.create({ studentId: user._id, listingId: item._id, status: 'Selected' });
    }
    expect((await request(app).get('/api/admin/analytics').set(auth(token))).body.data.selections).toBe(2);
  });
  it('IT-ANL-07 (TC-SEC-03): requires authentication', async () => {
    expect((await request(app).get('/api/admin/analytics')).status).toBe(401);
  });
  it.each([['08', createStudent], ['09', createRecruiter]])('IT-ANL-%s (TC-SEC-03): rejects non-admin analytics access', async (_id, factory) => {
    const { token } = await session(factory);
    expect((await request(app).get('/api/admin/analytics').set(auth(token))).status).toBe(403);
  });
  it('IT-ANL-10 (TC-ADM-03): returns aggregate counts without personal data', async () => {
    const { token } = await session(); const { user } = await createStudent();
    const res = await request(app).get('/api/admin/analytics').set(auth(token));
    expect(JSON.stringify(res.body)).not.toContain(user.email);
    expect(Object.values(res.body.data).every(Number.isInteger)).toBe(true);
  });
});
