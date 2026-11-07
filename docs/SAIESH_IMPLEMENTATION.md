# Admin and preparation implementation

## Scope and requirements

| Issue | Delivered |
| --- | --- |
| #12 / FR-12 | Student mock aptitude tests, server-side scoring, saved attempts, and curated interview questions |
| #15 / FR-11 | Admin-only `GET /api/admin/analytics` and placement analytics page |
| #25 | Admin, preparation, authorization, and audit integration tests |
| #26 | Browser performance workload, search index check, and recorded results |

Analytics counts student users, all listings, all applications, and applications in the `Selected` state. A student with two selected applications contributes two selections. The page explains these definitions and provides a refresh button.

The SRS specifies objective questions and automatic scoring, and TC-PREP-01 requires a stored score of 7/10. The implementation awards one point per correct answer, zero for a wrong or skipped answer, and permits repeat practice. The API requires one zero-based option index or `null` per question. It ignores client-supplied scores and student IDs, omits answer keys from responses, and limits attempt history to the authenticated student's latest 50 results. A ten-question Aptitude Basics test is seeded once at server startup. Interview guidance is served at `GET /api/prep/interview` and shown on the same student page. Successful submissions are audited. Failed logins and admin actions also create audit entries with an actor (where known), timestamp, and IP address; passwords are never logged.

## Validation

On 7 November 2026, the updated checkout passed all 151 server tests in 11 suites and the frontend build. Coverage was 98.12% of lines and 89.83% of branches overall; the service layer had 97.38% line coverage. The untouched `main` baseline passed 94 tests and built successfully. The project test conventions and shared factories are used throughout.

The full local performance workload passed with 50 concurrent Chromium browser contexts for 301 seconds. It used an isolated in-memory MongoDB seeded with 1,000 listings, 10,000 applications, and 1,000 selections. Search completed 7,175 page loads with a 1,135.69 ms p95; analytics completed 7,103 loads with a 1,151.92 ms p95. There were zero page errors, and MongoDB's winning search plan contained `IXSCAN` on `status_1_approvalStatus_1_deadline_1`. See `docs/reports/Performance_Results.json` for the environment, counts, timings, and query plan. These numbers describe this local test environment; CI runs the same workload separately.

## Reproducing performance checks

Build the client with `npm run build --prefix client`. Install Playwright in the server workspace with `npm install --prefix server --no-save --package-lock=false playwright@1.56.1`, then install Chromium with `npx --prefix server playwright install chromium`. Run `node server/scripts/performance.js` from the repository root. The script never connects to the application's configured database. `PERF_SECONDS` and `PERF_USERS` permit a short smoke run, but only a run of at least 300 seconds and 50 users can pass TC-NFR-01. The workflow saves the JSON report as a GitHub Actions artifact.
