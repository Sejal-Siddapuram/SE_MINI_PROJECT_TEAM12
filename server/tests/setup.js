const db = require('./helpers/db');

// Runs around every test file: start a temporary database, empty it between tests, stop it at the end.
beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clear();
});

afterAll(async () => {
  await db.close();
});
