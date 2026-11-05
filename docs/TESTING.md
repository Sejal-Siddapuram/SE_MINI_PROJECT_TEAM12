# Testing guide

How we test CampusReady for Part 3 (Test Plan Section 5).

## Run the tests

```bash
npm test                 # from the project root: runs every test once
npm run test:report      # runs everything and writes the reports into docs/reports/
```

The first run can take a minute, because it starts a temporary MongoDB in memory. Tests never touch your real `server/.data` database.

## Where tests live

```
server/tests/
  setup.js              starts/clears/stops the test database around every test file
  helpers/db.js         the test database connection
  helpers/factories.js  createStudent(), createRecruiter(), createAdmin(), loginAs(), auth()
  health.test.js        example test
```

One file per module, named after the area it tests, for example `auth.test.js`, `applications.test.js`, `recruiter.test.js`, `admin.test.js`.

## Writing a test

```js
const request = require('supertest');
const app = require('../src/app');
const { createStudent, loginAs, auth } = require('./helpers/factories');

describe('FR-05 Apply to listing', () => {
  it('IT-APP-01 (TC-APP-01): student with a complete profile can apply', async () => {
    const { user, password } = await createStudent();
    const token = await loginAs(user.email, password);

    const res = await request(app)
      .post('/api/applications')
      .set(auth(token))
      .send({ listingId: '...' });

    expect(res.status).toBe(201);
  });
});
```

## Test IDs

Every test name starts with its own ID, followed by the Test Plan ID it covers in brackets:

| Prefix | Kind | Where |
|---|---|---|
| `UT-` | Unit test: one function or middleware, no HTTP | `server/tests/*.test.js` |
| `IT-` | Integration test: a real API call through Supertest with the test database | `server/tests/*.test.js` |
| `ST-` | System test: done by hand on the running app, with screenshots | System Validation report |

Example: `IT-APP-02 (TC-APP-02): rejects a second application to the same listing`. Aim for 8–10 tests per functional requirement, covering both the success case and the error cases.

## Rules we follow

- Each test sets up its own data. The database is emptied after every test.
- Test the error cases too (400, 401, 403, 404, 409). That is what branch coverage measures.

## Reports (Part 3 deliverables)

`npm run test:report` creates:

| File | What it is |
|---|---|
| `docs/reports/Unit_Test_Report.html` | Every test with pass/fail and time taken |
| `docs/reports/coverage/index.html` | Line (code) coverage and branch coverage for every file in `server/src` |

Target from the Test Plan: at least 70% line coverage on the service layer, with branch coverage reported.

## CI

`.github/workflows/ci.yml` runs every test and builds the website on each push and pull request. Check for the green tick on your PR before asking for a merge. The test and coverage reports are attached to each run under **Actions → the run → Artifacts**.
