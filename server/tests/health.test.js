const request = require('supertest');
const app = require('../src/app');

// NFR-04: the health endpoint reports server and database status
describe('GET /api/health', () => {
  it('IT-HEALTH-01 (TC-NFR-04): returns ok and a connected database', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
  });

  it('IT-HEALTH-02: returns the standard 404 error for an unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({ code: 'NOT_FOUND' }),
    });
  });
});
