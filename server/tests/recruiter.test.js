const request = require('supertest');
const app = require('../src/app');
const Application = require('../src/models/Application');
const Listing = require('../src/models/Listing');
const StudentProfile = require('../src/models/StudentProfile');
const { createRecruiter, createStudent, loginAs, auth } = require('./helpers/factories');

function futureDate(daysAhead = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d;
}

async function createApprovedListing(recruiterId) {
  return Listing.create({
    recruiterId,
    company: 'Test Corp',
    title: 'Backend Intern',
    role: 'Backend Engineer',
    type: 'Internship',
    location: 'Bengaluru',
    description: 'Build APIs.',
    deadline: futureDate(),
    status: 'Published',
    approvalStatus: 'Approved',
  });
}

async function completeStudentProfile(userId) {
  return StudentProfile.findOneAndUpdate(
    { userId },
    { skills: ['JavaScript'], resumeUrl: 'cv.pdf' },
    { new: true }
  );
}

async function applyAsStudent(token, listingId) {
  return request(app)
    .post('/api/applications')
    .set(auth(token))
    .send({ listingId });
}

describe('FR-08 & FR-09 Recruiter applicant review', () => {
  it('IT-REC-APP-01 (TC-REC-02): recruiter fetches applicants for their own listing', async () => {
    const { user: recruiterUser, password: rPass } = await createRecruiter();
    const recruiterToken = await loginAs(recruiterUser.email, rPass);

    const listing = await createApprovedListing(recruiterUser._id);

    const { user: studentUser, password: sPass } = await createStudent();
    const studentToken = await loginAs(studentUser.email, sPass);
    await completeStudentProfile(studentUser._id);
    await applyAsStudent(studentToken, listing._id);

    const res = await request(app)
      .get(`/api/recruiter/listings/${listing._id}/applicants`)
      .set(auth(recruiterToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].student.email).toBe(studentUser.email);
    expect(res.body.data[0].status).toBe('Applied');
  });

  it('IT-REC-APP-02 (TC-REC-02): recruiter cannot view applicants for another recruiter listing', async () => {
    const { user: recruiterA, password: passA } = await createRecruiter();
    const { user: recruiterB, password: passB } = await createRecruiter();
    const tokenB = await loginAs(recruiterB.email, passB);

    const listing = await createApprovedListing(recruiterA._id);

    const res = await request(app)
      .get(`/api/recruiter/listings/${listing._id}/applicants`)
      .set(auth(tokenB));

    expect(res.status).toBe(403);
  });

  it('IT-REC-APP-03 (TC-REC-03): recruiter shortlists an applicant', async () => {
    const { user: recruiterUser, password: rPass } = await createRecruiter();
    const recruiterToken = await loginAs(recruiterUser.email, rPass);

    const listing = await createApprovedListing(recruiterUser._id);

    const { user: studentUser, password: sPass } = await createStudent();
    const studentToken = await loginAs(studentUser.email, sPass);
    await completeStudentProfile(studentUser._id);
    const applied = await applyAsStudent(studentToken, listing._id);
    const applicationId = applied.body.data._id;

    const res = await request(app)
      .patch(`/api/recruiter/applications/${applicationId}`)
      .set(auth(recruiterToken))
      .send({ status: 'Shortlisted' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Shortlisted');
  });

  it('IT-REC-APP-04 (TC-REC-03): recruiter rejects an applicant', async () => {
    const { user: recruiterUser, password: rPass } = await createRecruiter();
    const recruiterToken = await loginAs(recruiterUser.email, rPass);

    const listing = await createApprovedListing(recruiterUser._id);

    const { user: studentUser, password: sPass } = await createStudent();
    const studentToken = await loginAs(studentUser.email, sPass);
    await completeStudentProfile(studentUser._id);
    const applied = await applyAsStudent(studentToken, listing._id);
    const applicationId = applied.body.data._id;

    const res = await request(app)
      .patch(`/api/recruiter/applications/${applicationId}`)
      .set(auth(recruiterToken))
      .send({ status: 'Rejected' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Rejected');
  });

  it('IT-REC-APP-05 (TC-REC-03): recruiter selects a shortlisted applicant', async () => {
    const { user: recruiterUser, password: rPass } = await createRecruiter();
    const recruiterToken = await loginAs(recruiterUser.email, rPass);

    const listing = await createApprovedListing(recruiterUser._id);

    const { user: studentUser, password: sPass } = await createStudent();
    const studentToken = await loginAs(studentUser.email, sPass);
    await completeStudentProfile(studentUser._id);
    const applied = await applyAsStudent(studentToken, listing._id);
    const applicationId = applied.body.data._id;

    await Application.findByIdAndUpdate(applicationId, { status: 'Shortlisted' });

    const res = await request(app)
      .patch(`/api/recruiter/applications/${applicationId}`)
      .set(auth(recruiterToken))
      .send({ status: 'Selected' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Selected');
  });

  it('IT-REC-APP-06 (TC-REC-03): invalid status transition returns 409', async () => {
    const { user: recruiterUser, password: rPass } = await createRecruiter();
    const recruiterToken = await loginAs(recruiterUser.email, rPass);

    const listing = await createApprovedListing(recruiterUser._id);

    const { user: studentUser, password: sPass } = await createStudent();
    const studentToken = await loginAs(studentUser.email, sPass);
    await completeStudentProfile(studentUser._id);
    const applied = await applyAsStudent(studentToken, listing._id);
    const applicationId = applied.body.data._id;

    await Application.findByIdAndUpdate(applicationId, { status: 'Rejected' });

    const res = await request(app)
      .patch(`/api/recruiter/applications/${applicationId}`)
      .set(auth(recruiterToken))
      .send({ status: 'Shortlisted' });

    expect(res.status).toBe(409);
  });

  it('IT-REC-APP-07 (TC-REC-03): recruiter cannot update application for another recruiter listing', async () => {
    const { user: recruiterA, password: passA } = await createRecruiter();
    const tokenA = await loginAs(recruiterA.email, passA);
    const { user: recruiterB, password: passB } = await createRecruiter();
    const tokenB = await loginAs(recruiterB.email, passB);

    const listing = await createApprovedListing(recruiterA._id);

    const { user: studentUser, password: sPass } = await createStudent();
    const studentToken = await loginAs(studentUser.email, sPass);
    await completeStudentProfile(studentUser._id);
    const applied = await applyAsStudent(studentToken, listing._id);
    const applicationId = applied.body.data._id;

    const res = await request(app)
      .patch(`/api/recruiter/applications/${applicationId}`)
      .set(auth(tokenB))
      .send({ status: 'Shortlisted' });

    expect(res.status).toBe(403);
  });

  it('IT-REC-APP-08 (TC-REC-04): summary returns correct counts per status', async () => {
    const { user: recruiterUser, password: rPass } = await createRecruiter();
    const recruiterToken = await loginAs(recruiterUser.email, rPass);

    const listing = await createApprovedListing(recruiterUser._id);

    const studentA = await createStudent();
    const studentB = await createStudent();
    const tokenA = await loginAs(studentA.user.email, studentA.password);
    const tokenB = await loginAs(studentB.user.email, studentB.password);
    await completeStudentProfile(studentA.user._id);
    await completeStudentProfile(studentB.user._id);

    const appA = await applyAsStudent(tokenA, listing._id);
    await applyAsStudent(tokenB, listing._id);

    await Application.findByIdAndUpdate(appA.body.data._id, { status: 'Shortlisted' });

    const res = await request(app)
      .get(`/api/recruiter/listings/${listing._id}/applicants/summary`)
      .set(auth(recruiterToken));

    expect(res.status).toBe(200);
    expect(res.body.data.Shortlisted).toBe(1);
    expect(res.body.data.Applied).toBe(1);
    expect(res.body.data.total).toBe(2);
  });

  it('IT-REC-APP-09 (TC-REC-04): summary returns 403 for another recruiter listing', async () => {
    const { user: recruiterA, password: passA } = await createRecruiter();
    const { user: recruiterB, password: passB } = await createRecruiter();
    const tokenB = await loginAs(recruiterB.email, passB);

    const listing = await createApprovedListing(recruiterA._id);

    const res = await request(app)
      .get(`/api/recruiter/listings/${listing._id}/applicants/summary`)
      .set(auth(tokenB));

    expect(res.status).toBe(403);
  });
});
