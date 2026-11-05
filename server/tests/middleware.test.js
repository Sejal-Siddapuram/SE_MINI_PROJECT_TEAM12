const mongoose = require('mongoose');
const authorize = require('../src/middleware/rbac');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');
const AppError = require('../src/utils/AppError');
const { hashPassword, toPublicUser } = require('../src/services/authService');

/** Minimal fake Express response for unit tests */
function fakeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('RBAC middleware (FR-02, SR-03) - unit', () => {
  it('UT-AUTH-01 (TC-AUTH-03): lets an allowed role through', () => {
    const next = jest.fn();
    authorize('Admin', 'Recruiter')({ user: { role: 'Recruiter' } }, fakeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('UT-AUTH-02 (TC-AUTH-03): blocks a role that is not allowed with 403', () => {
    const next = jest.fn();
    authorize('Admin')({ user: { role: 'Student' } }, fakeRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('UT-AUTH-03: blocks a request with no user with 403', () => {
    const next = jest.fn();
    authorize('Student')({}, fakeRes(), next);
    expect(next.mock.calls[0][0].status).toBe(403);
  });
});

describe('Central error handler (SAD 4.4) - unit', () => {
  const run = (err) => {
    const res = fakeRes();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, {}, res, () => {});
    console.error.mockRestore();
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
  };

  it('UT-ERR-01: passes an AppError through with its status and code', () => {
    const { status, body } = run(new AppError(409, 'DUPLICATE_APPLICATION', 'Already applied.'));
    expect(status).toBe(409);
    expect(body).toEqual({ success: false, error: { code: 'DUPLICATE_APPLICATION', message: 'Already applied.', details: [] } });
  });

  it('UT-ERR-02: turns a Mongoose validation error into 400 with field details', () => {
    const err = new mongoose.Error.ValidationError();
    err.addError('semester', new mongoose.Error.ValidatorError({ path: 'semester', message: 'Too high' }));
    const { status, body } = run(err);
    expect(status).toBe(400);
    expect(body.error.details).toEqual([{ field: 'semester', message: 'Too high' }]);
  });

  it('UT-ERR-03: turns an invalid id (CastError) into 404', () => {
    expect(run(new mongoose.Error.CastError('ObjectId', 'abc', '_id')).status).toBe(404);
  });

  it('UT-ERR-04: turns a duplicate key error into 409', () => {
    expect(run(Object.assign(new Error('dup'), { code: 11000 })).status).toBe(409);
  });

  it('UT-ERR-05: hides unexpected errors behind a generic 500 message', () => {
    const { status, body } = run(new Error('database exploded'));
    expect(status).toBe(500);
    expect(body.error.message).not.toContain('exploded');
  });

  it('UT-ERR-06: notFound creates a 404 NOT_FOUND error', () => {
    const next = jest.fn();
    notFound({ method: 'GET', originalUrl: '/api/x' }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});

describe('Auth service helpers - unit', () => {
  it('UT-AUTH-04 (TC-SEC-01): hashPassword produces a different salted hash each time', async () => {
    const a = await hashPassword('Same12345');
    const b = await hashPassword('Same12345');
    expect(a).not.toBe(b);
  });

  it('UT-AUTH-05 (TC-SEC-01): toPublicUser never includes the password hash', () => {
    const user = { _id: new mongoose.Types.ObjectId(), name: 'A', email: 'a@x.com', role: 'Student', passwordHash: 'secret' };
    expect(toPublicUser(user)).not.toHaveProperty('passwordHash');
  });
});
