
const request = require('supertest');
const app = require('../src/app');
const Listing = require('../src/models/Listing');

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

async function createListing(recruiterId, overrides = {}) {
  return Listing.create({
    recruiterId,
    company: 'Alpha Technologies',
    title: 'Software Engineer Intern',
    role: 'Software Engineer',
    type: 'Internship',
    location: 'Bengaluru',
    description: 'Develop web applications using JavaScript.',
    deadline: futureDate(),
    status: 'Published',
    approvalStatus: 'Approved',
    ...overrides,
  });
}

describe('FR-04 Listing Search and Filters', () => {
  let studentToken;
  let recruiterId;

  beforeEach(async () => {
    const student = await createStudent();
    studentToken = await loginAs(student.user.email, student.password);

    const recruiter = await createRecruiter();
    recruiterId = recruiter.user._id;
  });

  it('searches listings by keyword', async () => {
    await createListing(recruiterId);

    const response = await request(app)
      .get('/api/listings')
      .query({ keyword: 'JavaScript' })
      .set(auth(studentToken));

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBe(1);
  });

  it('filters listings by role, company, location and type', async () => {
    await createListing(recruiterId);

    const response = await request(app)
      .get('/api/listings')
      .query({
        role: 'Software Engineer',
        company: 'Alpha',
        location: 'Bengaluru',
        type: 'Internship',
      })
      .set(auth(studentToken));

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBe(1);
  });

  it('combines multiple filters correctly', async () => {
    await createListing(recruiterId);
    await createListing(recruiterId, {
      title: 'Data Analyst',
      role: 'Data Analyst',
      company: 'Beta Technologies',
    });

    const response = await request(app)
      .get('/api/listings')
      .query({ company: 'Alpha', location: 'Bengaluru' })
      .set(auth(studentToken));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].company).toBe('Alpha Technologies');
  });

  it('hides Draft and unapproved listings from students', async () => {
    await createListing(recruiterId);
    await createListing(recruiterId, {
      title: 'Draft Listing',
      status: 'Draft',
    });
    await createListing(recruiterId, {
      title: 'Pending Listing',
      approvalStatus: 'Pending',
    });

    const response = await request(app)
      .get('/api/listings')
      .set(auth(studentToken));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe('Software Engineer Intern');
  });

  it('paginates results and limits page size to 50', async () => {
    for (let i = 0; i < 12; i++) {
      await createListing(recruiterId, {
        title: `Listing ${i}`,
      });
    }

    const firstPage = await request(app)
      .get('/api/listings')
      .query({ page: 1, limit: 5 })
      .set(auth(studentToken));

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.items).toHaveLength(5);
    expect(firstPage.body.data.total).toBe(12);
    expect(firstPage.body.data.totalPages).toBe(3);

    const secondPage = await request(app)
      .get('/api/listings')
      .query({ page: 2, limit: 5 })
      .set(auth(studentToken));

    expect(secondPage.body.data.items).toHaveLength(5);
    expect(secondPage.body.data.page).toBe(2);
  });

  it('rejects an invalid limit greater than 50', async () => {
    const response = await request(app)
      .get('/api/listings')
      .query({ limit: 51 })
      .set(auth(studentToken));

    expect(response.status).toBe(400);
  });

  it('filters listings by deadline', async () => {
    await createListing(recruiterId, {
      title: 'Earlier Deadline',
      deadline: futureDate(5),
    });
    await createListing(recruiterId, {
      title: 'Later Deadline',
      deadline: futureDate(60),
    });

    const cutoff = futureDate(10).toISOString().slice(0, 10);

    const response = await request(app)
      .get('/api/listings')
      .query({ deadlineBefore: cutoff })
      .set(auth(studentToken));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe('Earlier Deadline');
  });

  it('returns complete details for a visible listing', async () => {
    const listing = await createListing(recruiterId, {
      eligibility: 'CSE students',
    });

    const response = await request(app)
      .get(`/api/listings/${listing._id}`)
      .set(auth(studentToken));

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Software Engineer Intern');
    expect(response.body.data.description).toBe(
      'Develop web applications using JavaScript.'
    );
    expect(response.body.data.eligibility).toBe('CSE students');
  });

  it('returns 404 for a Draft listing detail request', async () => {
    const listing = await createListing(recruiterId, {
      status: 'Draft',
    });

    const response = await request(app)
      .get(`/api/listings/${listing._id}`)
      .set(auth(studentToken));

    expect(response.status).toBe(404);
  });
});
