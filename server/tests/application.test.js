
const request = require('supertest');
const app = require('../src/app');

const Application = require('../src/models/Application');
const Listing = require('../src/models/Listing');
const StudentProfile = require('../src/models/StudentProfile');

const {
  createStudent,
  createRecruiter,
  loginAs,
  auth,
} = require('./helpers/factories');

function futureDate(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function createPublishedListing(recruiterId, overrides = {}) {
  return Listing.create({
    recruiterId,
    company: 'Test Company',
    title: 'Software Engineer Intern',
    role: 'Software Engineer',
    type: 'Internship',
    location: 'Bengaluru',
    description: 'Work on software development.',
    deadline: futureDate(),
    status: 'Published',
    approvalStatus: 'Approved',
    ...overrides,
  });
}

async function completeProfile(userId) {
  return StudentProfile.findOneAndUpdate(
    { userId },
    {
      skills: ['JavaScript', 'Python'],
      resumeUrl: 'test-resume.pdf',
    },
    { new: true }
  );
}

describe('Student Applications (FR-05, FR-06)', () => {
  let recruiter;

  beforeEach(async () => {
    recruiter = await createRecruiter();
    await loginAs(recruiter.user.email, recruiter.password);
  });

  it('TC-APP-01: student with complete profile can apply successfully', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id);

    const response = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('Applied');
  });

  it('TC-APP-02: duplicate application is rejected', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id);

    const first = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    const second = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);

    expect(await Application.countDocuments({
      studentId: student.user._id,
      listingId: listing._id,
    })).toBe(1);
  });

  it('rejects application when student profile is incomplete', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    const listing = await createPublishedListing(recruiter.user._id);

    const response = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    expect(response.status).toBe(400);
  });

  it('TC-APP-03: rejects an application after the deadline', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id, {
      deadline: new Date(Date.now() - 86400000),
    });

    const response = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    expect(response.status).toBe(410);
  });

  it('rejects applications for unpublished or unapproved listings', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id, {
      status: 'Draft',
    });

    const response = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    expect(response.status).toBe(404);
  });

  it('returns only the logged-in student applications', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id);

    await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    const response = await request(app)
      .get('/api/applications/me')
      .set(auth(token));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].listing.title).toBe('Software Engineer Intern');
  });

  it('TC-NFR-03: application persists with status and date after a fresh API request', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id);

    const applied = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    expect(applied.status).toBe(201);

    const applicationId = applied.body.data._id;
    const originalDate = applied.body.data.appliedAt;

    expect(originalDate).toBeDefined();

    const refreshed = await request(app)
      .get('/api/applications/me')
      .set(auth(token));

    expect(refreshed.status).toBe(200);

    const savedApplication = refreshed.body.data.find(
      (item) => String(item.id) === String(applicationId)
    );

    expect(savedApplication).toBeDefined();
    expect(savedApplication.status).toBe('Applied');

    expect(new Date(savedApplication.appliedAt).getTime())
      .toBe(new Date(originalDate).getTime());
  });

  it('TC-APP-04: allows withdrawal while status is Applied and permits reapplication', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id);

    const applied = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    const applicationId = applied.body.data._id;

    const withdrawn = await request(app)
      .delete(`/api/applications/${applicationId}`)
      .set(auth(token));

    expect(withdrawn.status).toBe(204);

    const reapplied = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    expect(reapplied.status).toBe(201);
  });

  it('prevents withdrawal after recruiter decision', async () => {
    const student = await createStudent();
    const token = await loginAs(student.user.email, student.password);
    await completeProfile(student.user._id);

    const listing = await createPublishedListing(recruiter.user._id);

    const applied = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: listing._id });

    await Application.findByIdAndUpdate(applied.body.data._id, {
      status: 'Shortlisted',
    });

    const response = await request(app)
      .delete(`/api/applications/${applied.body.data._id}`)
      .set(auth(token));

    expect(response.status).toBe(409);
  });

  it('prevents one student from withdrawing another student application', async () => {
    const studentA = await createStudent();
    const tokenA = await loginAs(studentA.user.email, studentA.password);
    await completeProfile(studentA.user._id);

    const studentB = await createStudent();
    const tokenB = await loginAs(studentB.user.email, studentB.password);
    await completeProfile(studentB.user._id);

    const listing = await createPublishedListing(recruiter.user._id);

    const applied = await request(app)
      .post('/api/applications')
      .set(auth(tokenA))
      .send({ listingId: listing._id });

    const response = await request(app)
      .delete(`/api/applications/${applied.body.data._id}`)
      .set(auth(tokenB));

    expect(response.status).toBe(403);
  });
});
