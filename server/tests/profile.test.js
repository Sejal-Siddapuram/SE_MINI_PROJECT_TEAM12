const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const StudentProfile = require('../src/models/StudentProfile');
const { UPLOAD_DIR } = require('../src/middleware/resumeUpload');
const { createStudent, loginAs, auth } = require('./helpers/factories');

/** A small but valid PDF of roughly the requested size */
function pdfBuffer(bytes = 1024) {
  const header = Buffer.from('%PDF-1.4\n');
  return Buffer.concat([header, Buffer.alloc(Math.max(bytes - header.length, 0), 'a')]);
}

async function loggedInStudent() {
  const { user, password } = await createStudent();
  const token = await loginAs(user.email, password);
  return { user, token };
}

afterAll(() => {
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
});

describe('FR-03 Student profile', () => {
  it('IT-PROF-01: returns the logged-in student\'s own profile', async () => {
    const { user, token } = await loggedInStudent();
    const res = await request(app).get('/api/profile').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: user.email, branch: 'CSE', semester: 5, hasResume: false, isComplete: false });
  });

  it('IT-PROF-02 (TC-PROF-01): saves branch, semester, CGPA and skills, and returns them on reload', async () => {
    const { token } = await loggedInStudent();
    const save = await request(app)
      .put('/api/profile')
      .set(auth(token))
      .send({ branch: 'ECE', semester: 7, cgpa: 8.4, skills: ['Java', ' React ', 'java'] });

    expect(save.status).toBe(200);
    const reload = await request(app).get('/api/profile').set(auth(token));
    expect(reload.body.data).toMatchObject({ branch: 'ECE', semester: 7, cgpa: 8.4, skills: ['Java', 'React'] });
  });

  it('IT-PROF-03 (TC-PROF-01): can change the name and clear the CGPA', async () => {
    const { token } = await loggedInStudent();
    await request(app).put('/api/profile').set(auth(token)).send({ cgpa: 9 });
    const res = await request(app).put('/api/profile').set(auth(token)).send({ name: 'New Name', cgpa: null });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
    expect(res.body.data.cgpa).toBeNull();
  });

  it.each([
    ['IT-PROF-04', 'semester 0', { semester: 0 }, 'semester'],
    ['IT-PROF-05', 'CGPA above 10', { cgpa: 11 }, 'cgpa'],
    ['IT-PROF-06', 'skills that are not a list', { skills: 'Java' }, 'skills'],
    ['IT-PROF-07', 'an empty name', { name: '  ' }, 'name'],
    ['IT-PROF-08', 'a blank skill', { skills: ['Java', ''] }, 'skills[1]'],
  ])('%s: rejects %s with 400', async (_id, _label, body, field) => {
    const { token } = await loggedInStudent();
    const res = await request(app).put('/api/profile').set(auth(token)).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
  });

  it('IT-PROF-09 (TC-PROF-01): uploads a valid 1 MB PDF resume and stores only a reference to it', async () => {
    const { user, token } = await loggedInStudent();
    const res = await request(app)
      .post('/api/profile/resume')
      .set(auth(token))
      .attach('resume', pdfBuffer(1024 * 1024), { filename: 'Asha_Resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ hasResume: true, resumeOriginalName: 'Asha_Resume.pdf' });

    const profile = await StudentProfile.findOne({ userId: user._id });
    expect(profile.resumeUrl).toMatch(/\.pdf$/);
    expect(fs.existsSync(path.join(UPLOAD_DIR, profile.resumeUrl))).toBe(true);
  });

  it('IT-PROF-10: marks the profile complete once skills and a resume are added', async () => {
    const { token } = await loggedInStudent();
    await request(app).put('/api/profile').set(auth(token)).send({ skills: ['SQL'] });
    const res = await request(app)
      .post('/api/profile/resume')
      .set(auth(token))
      .attach('resume', pdfBuffer(), { filename: 'cv.pdf', contentType: 'application/pdf' });

    expect(res.body.data.isComplete).toBe(true);
  });

  it('IT-PROF-11: replacing the resume deletes the old file', async () => {
    const { user, token } = await loggedInStudent();
    const upload = () =>
      request(app)
        .post('/api/profile/resume')
        .set(auth(token))
        .attach('resume', pdfBuffer(), { filename: 'cv.pdf', contentType: 'application/pdf' });

    await upload();
    const first = (await StudentProfile.findOne({ userId: user._id })).resumeUrl;
    await upload();
    const second = (await StudentProfile.findOne({ userId: user._id })).resumeUrl;

    expect(second).not.toBe(first);
    await new Promise((r) => setTimeout(r, 100));
    expect(fs.existsSync(path.join(UPLOAD_DIR, first))).toBe(false);
  });

  it('IT-PROF-12: lets the student download their own resume', async () => {
    const { token } = await loggedInStudent();
    await request(app)
      .post('/api/profile/resume')
      .set(auth(token))
      .attach('resume', pdfBuffer(), { filename: 'cv.pdf', contentType: 'application/pdf' });

    const res = await request(app).get('/api/profile/resume').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });

  it('IT-PROF-13: returns 404 when downloading before any resume was uploaded', async () => {
    const { token } = await loggedInStudent();
    const res = await request(app).get('/api/profile/resume').set(auth(token));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESUME_NOT_FOUND');
  });

  it('IT-PROF-14: returns 400 when the upload has no file', async () => {
    const { token } = await loggedInStudent();
    const res = await request(app).post('/api/profile/resume').set(auth(token)).field('note', 'no file');
    expect(res.status).toBe(400);
  });
});
