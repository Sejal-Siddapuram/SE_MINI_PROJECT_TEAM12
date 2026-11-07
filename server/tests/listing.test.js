const request = require('supertest');
const app = require('../src/app');
const { createRecruiter, createStudent, loginAs, auth } = require('./helpers/factories');

function futureDate(daysAhead = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function listingPayload(overrides = {}) {
  return {
    title: 'SDE Intern',
    role: 'Software Engineer Intern',
    type: 'Internship',
    location: 'Bengaluru',
    description: 'Build distributed systems.',
    deadline: futureDate(),
    ...overrides,
  };
}

async function loggedInRecruiter(overrides = {}) {
  const { user, password } = await createRecruiter(overrides);
  const token = await loginAs(user.email, password);
  return { user, token };
}

describe('FR-07 Recruiter listings', () => {
  it('IT-LIST-01 (TC-REC-01): POST /api/listings with valid data creates a Draft listing pending approval', async () => {
    const { token } = await loggedInRecruiter();
    const res = await request(app)
      .post('/api/listings')
      .set(auth(token))
      .send(listingPayload());

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'SDE Intern',
      status: 'Draft',
      approvalStatus: 'Pending',
    });
  });

  it('IT-LIST-02 (TC-REC-01): PATCH /api/listings/:id/publish { action: publish } transitions status to Published', async () => {
    const { token } = await loggedInRecruiter();
    const create = await request(app)
      .post('/api/listings')
      .set(auth(token))
      .send(listingPayload());

    expect(create.status).toBe(201);
    const id = create.body.data._id;

    const res = await request(app)
      .patch(`/api/listings/${id}/publish`)
      .set(auth(token))
      .send({ action: 'publish' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Published');
  });

  it('IT-LIST-03 (TC-REC-01): PUT /api/listings/:id updates fields and persists changes', async () => {
    const { token } = await loggedInRecruiter();
    const create = await request(app)
      .post('/api/listings')
      .set(auth(token))
      .send(listingPayload());

    expect(create.status).toBe(201);
    const id = create.body.data._id;

    const res = await request(app)
      .put(`/api/listings/${id}`)
      .set(auth(token))
      .send({ title: 'Senior SDE', location: 'Hyderabad' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Senior SDE', location: 'Hyderabad' });
  });

  it('IT-LIST-04 (TC-REC-01): POST /api/listings missing required title field returns 400', async () => {
    const { token } = await loggedInRecruiter();
    const res = await request(app)
      .post('/api/listings')
      .set(auth(token))
      .send(listingPayload({ title: '' }));

    expect(res.status).toBe(400);
  });

  it('IT-LIST-05 (TC-REC-01): POST /api/listings with a past deadline returns 400', async () => {
    const { token } = await loggedInRecruiter();
    const yesterday = new Date(Date.now() - 86400 * 1000).toISOString();
    const res = await request(app)
      .post('/api/listings')
      .set(auth(token))
      .send(listingPayload({ deadline: yesterday }));

    expect(res.status).toBe(400);
  });

  it('IT-LIST-06 (TC-REC-01): Student token cannot create listings — returns 403 (SR-03 RBAC)', async () => {
    const { user, password } = await createStudent();
    const token = await loginAs(user.email, password);

    const res = await request(app)
      .post('/api/listings')
      .set(auth(token))
      .send(listingPayload());

    expect(res.status).toBe(403);
  });

  it('IT-LIST-07 (TC-REC-02): Recruiter B cannot edit Recruiter A listing — returns 403 (BR-03 ownership)', async () => {
    const { token: tokenA } = await loggedInRecruiter();
    const { token: tokenB } = await loggedInRecruiter();

    const create = await request(app)
      .post('/api/listings')
      .set(auth(tokenA))
      .send(listingPayload());

    expect(create.status).toBe(201);
    const id = create.body.data._id;

    const res = await request(app)
      .put(`/api/listings/${id}`)
      .set(auth(tokenB))
      .send({ title: 'Hijacked Title' });

    expect(res.status).toBe(403);
  });

  it('IT-LIST-08 (TC-REC-03): GET /api/recruiter/listings returns the recruiter own listings with correct data', async () => {
    const { token } = await loggedInRecruiter();
    await request(app).post('/api/listings').set(auth(token)).send(listingPayload());

    const res = await request(app).get('/api/recruiter/listings').set(auth(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toMatchObject({ title: 'SDE Intern' });
  });

  it('IT-LIST-09 (TC-REC-04): GET /api/recruiter/listings returns only the calling recruiter own listings', async () => {
    const { token: tokenA } = await loggedInRecruiter();
    const { token: tokenB } = await loggedInRecruiter();

    await request(app).post('/api/listings').set(auth(tokenA)).send(listingPayload({ title: 'Recruiter A Job' }));
    await request(app).post('/api/listings').set(auth(tokenB)).send(listingPayload({ title: 'Recruiter B Job' }));

    const res = await request(app).get('/api/recruiter/listings').set(auth(tokenA));

    expect(res.status).toBe(200);
    const titles = res.body.data.map((l) => l.title);
    expect(titles).toContain('Recruiter A Job');
    expect(titles).not.toContain('Recruiter B Job');
  });
  it('IT-LIST-10 (TC-NFR-03): listing persists in database and retains all attributes across reload', async () => {
    const { token } = await loggedInRecruiter();
    const payload = listingPayload({
      title: 'Persistent SDE',
      role: 'Software Engineer',
      location: 'Bengaluru',
      description: 'Persistence check description.',
    });
    const created = await request(app).post('/api/listings').set(auth(token)).send(payload);
    expect(created.status).toBe(201);
    const listingId = created.body.data._id;

    const reloaded = await request(app).get('/api/recruiter/listings/' + listingId).set(auth(token));
    expect(reloaded.status).toBe(200);
    expect(reloaded.body.data).toMatchObject({
      _id: listingId,
      title: 'Persistent SDE',
      role: 'Software Engineer',
      location: 'Bengaluru',
      description: 'Persistence check description.',
      status: 'Draft',
      approvalStatus: 'Pending',
    });
  });
});
