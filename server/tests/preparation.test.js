const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const MockTest = require('../src/models/MockTest');
const MockAttempt = require('../src/models/MockAttempt');
const AuditLog = require('../src/models/AuditLog');
const seedMockTests = require('../src/utils/seedMockTests');
const { createStudent, createRecruiter, createAdmin, loginAs, auth } = require('./helpers/factories');

async function session(factory = createStudent) {
  const { user, password } = await factory();
  return { user, token: await loginAs(user.email, password) };
}
async function fixture() {
  return MockTest.create({ title: 'Known answers', questions: [
    { prompt: '2+2?', options: ['3', '4'], correctOption: 1 },
    { prompt: '3+3?', options: ['6', '7'], correctOption: 0 },
    { prompt: '4+4?', options: ['7', '8'], correctOption: 1 },
  ] });
}
describe('FR-12 mock aptitude tests and automated scoring', () => {
  it('IT-PREP-21 (TC-PREP-01): stores and returns a score of 7 out of 10', async () => {
    const { user, token } = await session();
    const questions = Array.from({ length: 10 }, (_, i) => ({
      prompt: `Question ${i + 1}`, options: ['Wrong', 'Correct'], correctOption: 1,
    }));
    const test = await MockTest.create({ title: 'Ten questions', questions });
    const res = await request(app).post('/api/prep/tests/' + test.id + '/submit')
      .set(auth(token)).send({ answers: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0] });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ studentId: user.id, score: 7, total: 10, percentage: 70 });
    const saved = await MockAttempt.findById(res.body.data._id);
    expect(saved).toMatchObject({ score: 7, total: 10, percentage: 70 });
  });
  it('IT-PREP-22 (TC-PREP-01): serves curated interview content to students only', async () => {
    const { token } = await session();
    const res = await request(app).get('/api/prep/interview').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toEqual(expect.objectContaining({ topic: expect.any(String),
      question: expect.any(String), guidance: expect.any(String) }));
    expect((await request(app).get('/api/prep/interview')).status).toBe(401);
    const recruiter = await session(createRecruiter);
    expect((await request(app).get('/api/prep/interview').set(auth(recruiter.token))).status).toBe(403);
  });
  it('IT-PREP-01 (TC-PREP-01): lists tests and serves questions without answer keys', async () => {
    const { token } = await session(); const test = await fixture();
    const list = await request(app).get('/api/prep/tests').set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([{ id: test.id, title: 'Known answers', questionCount: 3 }]);
    const res = await request(app).get('/api/prep/tests/' + test.id).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.questions[0]).toEqual({ prompt: '2+2?', options: ['3', '4'] });
    expect(JSON.stringify([list.body, res.body])).not.toContain('correctOption');
  });
  it.each([
    ['02', [1, 0, 1], 3, 100],
    ['03', [0, 1, 0], 0, 0],
    ['04', [1, null, 0], 1, 33.33],
    ['05', [null, null, null], 0, 0],
  ])('IT-PREP-%s (TC-PREP-01): computes the score from stored answers', async (_id, answers, score, percentage) => {
    const { user, token } = await session(); const test = await fixture();
    const res = await request(app).post('/api/prep/tests/' + test.id + '/submit').set(auth(token))
      .send({ answers, score: 999, percentage: 100, studentId: new mongoose.Types.ObjectId() });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ studentId: user.id, score, total: 3, percentage, answers });
    expect(await MockAttempt.countDocuments({ studentId: user._id, score })).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain('correctOption');
    const audit = await AuditLog.findOne({ action: 'SUBMIT_MOCK_TEST' });
    expect(audit.userId.toString()).toBe(user.id);
    expect(audit.targetId.toString()).toBe(res.body.data._id);
  });
  it.each([
    ['06', [1]], ['07', [1, 0, 1, 0]], ['08', [-1, 0, 1]], ['09', [2, 0, 1]],
    ['10', ['1', 0, 1]], ['11', [true, 0, 1]], ['12', [0.5, 0, 1]], ['13', 'invalid'],
  ])('IT-PREP-%s (TC-PREP-01): rejects invalid answers without saving a result', async (_id, answers) => {
    const { token } = await session(); const test = await fixture();
    const res = await request(app).post('/api/prep/tests/' + test.id + '/submit').set(auth(token)).send({ answers });
    expect(res.status).toBe(400);
    expect(await MockAttempt.countDocuments({})).toBe(0);
    expect(await AuditLog.countDocuments({ action: 'SUBMIT_MOCK_TEST' })).toBe(0);
  });
  it('IT-PREP-14 (TC-PREP-01): returns empty lists before tests or attempts exist', async () => {
    const { token } = await session();
    for (const url of ['/api/prep/tests', '/api/prep/tests/attempts']) {
      const res = await request(app).get(url).set(auth(token));
      expect(res.status).toBe(200); expect(res.body.data).toEqual([]);
    }
  });
  it('IT-PREP-15 (TC-PREP-01): returns 404 for missing tests on read and submit', async () => {
    const { token } = await session(); const id = new mongoose.Types.ObjectId();
    expect((await request(app).get('/api/prep/tests/' + id).set(auth(token))).status).toBe(404);
    expect((await request(app).post('/api/prep/tests/' + id + '/submit').set(auth(token)).send({ answers: [] })).status).toBe(404);
  });
  it('IT-PREP-16 (TC-PREP-01): rejects malformed IDs and a missing answers field', async () => {
    const { token } = await session(); const test = await fixture();
    expect((await request(app).get('/api/prep/tests/bad-id').set(auth(token))).status).toBe(400);
    expect((await request(app).post('/api/prep/tests/' + test.id + '/submit').set(auth(token)).send({})).status).toBe(400);
  });
  it('IT-PREP-17 (TC-SEC-03): requires authentication for every mock-test operation', async () => {
    const test = await fixture();
    for (const url of ['/api/prep/tests', '/api/prep/tests/attempts', '/api/prep/tests/' + test.id]) {
      expect((await request(app).get(url)).status).toBe(401);
    }
    expect((await request(app).post('/api/prep/tests/' + test.id + '/submit').send({ answers: [1, 0, 1] })).status).toBe(401);
  });
  it.each([createAdmin, createRecruiter])('IT-PREP-18 (TC-SEC-03): blocks non-students on every operation (%p)', async (factory) => {
    const { token } = await session(factory); const test = await fixture();
    for (const url of ['/api/prep/tests', '/api/prep/tests/attempts', '/api/prep/tests/' + test.id]) {
      expect((await request(app).get(url).set(auth(token))).status).toBe(403);
    }
    expect((await request(app).post('/api/prep/tests/' + test.id + '/submit').set(auth(token)).send({ answers: [1, 0, 1] })).status).toBe(403);
  });
  it('IT-PREP-19 (TC-SEC-03): returns only the logged-in student results, newest first', async () => {
    const first = await session(); const second = await session(); const test = await fixture();
    const submit = (token, answers) => request(app).post('/api/prep/tests/' + test.id + '/submit').set(auth(token)).send({ answers });
    await submit(first.token, [0, 1, 0]); await submit(second.token, [1, 0, 1]);
    const latest = await submit(first.token, [1, 0, 1]);
    const history = await request(app).get('/api/prep/tests/attempts?studentId=' + second.user.id).set(auth(first.token));
    expect(history.status).toBe(200); expect(history.body.data).toHaveLength(2);
    expect(history.body.data[0]._id).toBe(latest.body.data._id);
    expect(history.body.data.every((a) => a.studentId === first.user.id)).toBe(true);
    expect(history.body.data[0].testId.title).toBe(test.title);
  });
  it('IT-PREP-20 (TC-PREP-01): seeds the starter test once with valid answer keys', async () => {
    await seedMockTests(); await seedMockTests();
    expect(await MockTest.countDocuments({})).toBe(1);
    const { token } = await session(); const test = await MockTest.findOne();
    const res = await request(app).post('/api/prep/tests/' + test.id + '/submit').set(auth(token))
      .send({ answers: [1, 2, 1, 2, 1, 2, 1, 2, 2, 1] });
    expect(res.status).toBe(201); expect(res.body.data.score).toBe(10);
  });
});
