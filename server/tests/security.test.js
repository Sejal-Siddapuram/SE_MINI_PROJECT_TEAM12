const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const { JWT_SECRET } = require('../src/config/env');
const { createStudent, loginAs, auth } = require('./helpers/factories');

describe('SR-01 Password storage', () => {
  it('IT-SEC-01 (TC-SEC-01): stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Hash Check',
      usn: 'PES1UG24CS150',
      email: 'hash@pesu.pes.edu',
      password: 'Secret12345',
      branch: 'CSE',
      semester: 3,
    });

    const user = await User.findOne({ email: 'hash@pesu.pes.edu' }).select('+passwordHash').lean();
    expect(user.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(JSON.stringify(user)).not.toContain('Secret12345');
  });

  it('IT-SEC-02 (TC-SEC-01): never returns the password hash in API responses', async () => {
    const { user, password } = await createStudent();
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    const me = await request(app).get('/api/auth/me').set(auth(login.body.data.token));

    expect(JSON.stringify(login.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect(JSON.stringify(me.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });
});

describe('SR-04 Token expiry and logout', () => {
  it('IT-SEC-03 (TC-SEC-04): rejects an expired token with 401', async () => {
    const { user } = await createStudent();
    const expired = jwt.sign({ sub: user._id.toString(), role: 'Student', name: user.name }, JWT_SECRET, {
      expiresIn: -10,
      jwtid: 'expired-token',
    });

    const res = await request(app).get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
  });

  it('IT-SEC-04 (TC-SEC-04): rejects a token after logout with 401, while a new login still works', async () => {
    const { user, password } = await createStudent();
    const token = await loginAs(user.email, password);

    expect((await request(app).post('/api/auth/logout').set(auth(token))).status).toBe(200);
    const afterLogout = await request(app).get('/api/auth/me').set(auth(token));
    expect(afterLogout.status).toBe(401);

    const newToken = await loginAs(user.email, password);
    expect((await request(app).get('/api/auth/me').set(auth(newToken))).status).toBe(200);
  });

  it('IT-SEC-05 (TC-SEC-04): logging out twice with the same token is rejected the second time', async () => {
    const { user, password } = await createStudent();
    const token = await loginAs(user.email, password);
    await request(app).post('/api/auth/logout').set(auth(token));

    const again = await request(app).post('/api/auth/logout').set(auth(token));
    expect(again.status).toBe(401);
  });

  it('IT-SEC-06 (TC-SEC-04): rejects a token with a tampered signature', async () => {
    const { user, password } = await createStudent();
    const token = await loginAs(user.email, password);
    const [header, body] = token.split('.');
    const forgedBody = Buffer.from(JSON.stringify({ ...jwt.decode(token), role: 'Admin' })).toString('base64url');

    const res = await request(app).get('/api/auth/me').set(auth(`${header}.${forgedBody}.${token.split('.')[2]}`));
    expect(res.status).toBe(401);
    expect(body).toBeDefined();
  });

  it('IT-SEC-07 (TC-SEC-04): rejects a token signed with a different secret', async () => {
    const { user } = await createStudent();
    const fake = jwt.sign({ sub: user._id.toString(), role: 'Admin' }, 'not-our-secret', { expiresIn: '1h' });
    expect((await request(app).get('/api/auth/me').set(auth(fake))).status).toBe(401);
  });

  it('IT-SEC-08: rejects an Authorization header that is not a Bearer token', async () => {
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Basic abc')).status).toBe(401);
  });
});

describe('SR-05 Resume upload validation', () => {
  let token;
  beforeEach(async () => {
    const { user, password } = await createStudent();
    token = await loginAs(user.email, password);
  });

  const upload = (buffer, filename, contentType) =>
    request(app).post('/api/profile/resume').set(auth(token)).attach('resume', buffer, { filename, contentType });

  it('IT-SEC-09 (TC-SEC-05): rejects an .exe renamed to .pdf with 415', async () => {
    const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(2048, 0)]);
    const res = await upload(exe, 'resume.pdf', 'application/pdf');
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('IT-SEC-10 (TC-SEC-05): rejects a 5 MB PDF with 413', async () => {
    const big = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(5 * 1024 * 1024, 'a')]);
    const res = await upload(big, 'big.pdf', 'application/pdf');
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('IT-SEC-11 (TC-SEC-05): rejects a non-PDF file type with 415', async () => {
    const res = await upload(Buffer.from('hello'), 'resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(res.status).toBe(415);
  });

  it('IT-SEC-12 (TC-SEC-05): accepts a valid PDF', async () => {
    const res = await upload(Buffer.from('%PDF-1.4\nvalid'), 'ok.pdf', 'application/pdf');
    expect(res.status).toBe(200);
  });
});

describe('SR-03 / TC-SEC-07 Injection and script input', () => {
  it('IT-SEC-13 (TC-SEC-07): NoSQL operator injection in login is rejected, not used to log in', async () => {
    await createStudent();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.data).toBeUndefined();
  });

  it('IT-SEC-14 (TC-SEC-07): a script tag in the name is stored as plain text, not executed', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '<script>alert(1)</script>',
      usn: 'PES1UG24CS160',
      email: 'xss@pesu.pes.edu',
      password: 'Xss123456',
      branch: 'CSE',
      semester: 2,
    });
    expect(res.status).toBe(201);

    const token = await loginAs('xss@pesu.pes.edu', 'Xss123456');
    const me = await request(app).get('/api/auth/me').set(auth(token));
    expect(me.body.data.user.name).toBe('<script>alert(1)</script>');
    expect(me.headers['content-type']).toMatch(/application\/json/);
  });

  it('IT-SEC-15: rejects a request body that is not valid JSON with 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});


describe('SR-02 / TC-SEC-02 Transport security and headers', () => {
  it('IT-SEC-16 (TC-SEC-02): sets HSTS and security headers via Helmet', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('IT-SEC-17 (TC-SEC-02): sets upgrade-insecure-requests in Content-Security-Policy', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toContain('upgrade-insecure-requests');
  });
});
