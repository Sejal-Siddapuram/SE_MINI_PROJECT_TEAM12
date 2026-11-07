# System validation report

## Findings

All 163 automated tests passed across 12 test suites with zero failures. Code coverage reached 98.12% line coverage and 89.83% branch coverage across server code, exceeding the 70% requirement. Service layer coverage reached 97.38%.

Manual system validation confirmed functional workflows for student registration, authentication, profile management, resume upload, session termination, and recruiter listing management.

Security checks verified password hashing with bcrypt, token invalidation upon logout, input sanitisation against script tags and operator injection, and transport security headers including HTTP Strict Transport Security.

Performance checks passed with 50 concurrent users over 301 seconds, with search 95th percentile response at 1135.69 ms and analytics at 1151.92 ms, under the 3000 ms threshold.

Identified limitations:
- Mobile viewport at 360 pixels width shows partial clipping on the applications table.
- Five-student usability trial for TC-NFR-02 remains pending.

## Automated test results

Execution date: 7 November 2026
Test runner: Jest with MongoDB Memory Server
Total suites: 12 passed, 12 total
Total tests: 163 passed, 0 failed
Duration: 73.76 seconds

Suite breakdown:
- admin.test.js: 21 passed
- recruiter.test.js: 9 passed
- security.test.js: 17 passed
- preparation.test.js: 19 passed
- listing.test.js: 10 passed
- application.test.js: 10 passed
- profile.test.js: 14 passed
- search.test.js: 16 passed
- auth.test.js: 14 passed
- notification.test.js: 12 passed
- middleware.test.js: 16 passed
- health.test.js: 5 passed

## Requirement traceability and test mapping

FR-01 and FR-02: User registration and login
- Automated tests: auth.test.js (IT-AUTH-01 to IT-AUTH-14)
- System validation: UC-01_1 to UC-01_4
- Evidence: Empty form field errors, successful registration response, invalid credential rejection, and successful login redirecting to dashboard.

FR-03: Student profile and resume
- Automated tests: profile.test.js (IT-PROF-01 to IT-PROF-14)
- System validation: UC-02_1 to UC-02_3
- Evidence: Incomplete profile status on new account, non-PDF file rejection, and complete profile status upon saving skills, CGPA, and PDF resume.

FR-04: Listing search and filtering
- Automated tests: search.test.js (IT-SCH-01 to IT-SCH-16)
- Evidence: Query filtering by location, role, and keyword; pagination and sorting verification.

FR-05 and FR-06: Student applications and withdrawal
- Automated tests: application.test.js (TC-APP-01 to TC-APP-04)
- Evidence: Application creation, duplicate prevention, deadline checks, and withdrawal before decision.

FR-07: Recruiter listings
- Automated tests: listing.test.js (IT-LIST-01 to IT-LIST-10)
- Evidence: Draft creation, state transition to Published, edit persistence, validation error handling on empty title or past deadline, and student role rejection.

FR-08 and FR-09: Recruiter applicant review and status
- Automated tests: recruiter.test.js (IT-REC-APP-01 to IT-REC-APP-09)
- Evidence: Retrieval of applicants with profile details, status updates to Shortlisted, Rejected, or Selected, status transition validation (409 on invalid change), recruiter ownership checks (403 on cross-recruiter access), and applicant count summaries.

FR-10 and FR-11: Admin moderation and placement analytics
- Automated tests: admin.test.js (IT-ADM-01 to IT-ADM-20, IT-ANL-01 to IT-ANL-09)
- Evidence: Listing approval and removal, recruiter verification, student and listing metrics calculation.

FR-12: Aptitude tests and interview guidance
- Automated tests: preparation.test.js (IT-PREP-01 to IT-PREP-19)
- Evidence: Objective question scoring, attempt history storage, and interview guidance retrieval.

SR-01: Password storage
- Automated tests: security.test.js (IT-SEC-01, IT-SEC-02), middleware.test.js (UT-AUTH-04, UT-AUTH-05)
- Evidence: Passwords stored as salted bcrypt hashes, excluded from responses.

SR-02: Transport security
- Automated tests: security.test.js (IT-SEC-16, IT-SEC-17)
- Evidence: Strict-Transport-Security header present with max-age 31536000 and includeSubDomains; upgrade-insecure-requests configured in Content-Security-Policy.

SR-03: Role-based access control and sanitisation
- Automated tests: security.test.js (IT-SEC-13 to IT-SEC-15), admin.test.js (IT-ADM-19), listing.test.js (IT-LIST-06, IT-LIST-07)
- Evidence: Student tokens rejected on recruiter routes with 403; NoSQL operator injection rejected with 400; HTML script tags persisted as plain text without execution.

SR-04: Session termination and token revocation
- Automated tests: security.test.js (IT-SEC-03 to IT-SEC-08)
- System validation: SR-04_1, SR-04_2
- Evidence: Navigation to protected profile route redirects to login after logout; revoked token rejected with 401 Unauthorized on subsequent requests.

SR-05: Upload file validation
- Automated tests: security.test.js (IT-SEC-09 to IT-SEC-12)
- System validation: UC-02_2
- Evidence: Rejection of non-PDF MIME types with 415, oversized files exceeding 2 MB with 413, and acceptance of valid PDF buffers.

NFR-01: System performance
- Automated benchmark: performance.js workload (50 users, 301 seconds)
- Evidence: 7175 search page loads (p95 1135.69 ms), 7103 analytics loads (p95 1151.92 ms), zero errors, indexed query execution confirmed in Performance_Results.json.

NFR-02: Usability
- Inspection and mobile emulation: NFR-02-Usability.md
- Evidence: Responsive navigation and focus rings verified on desktop and mobile viewports.

NFR-03: Data persistence
- Automated tests: listing.test.js (IT-LIST-10), application.test.js (TC-NFR-03)
- Evidence: Created listing attributes and application status persist across independent requests.

NFR-04: Service availability
- Automated tests: health.test.js (IT-HEALTH-01)
- Evidence: Endpoint returns status ok and database connected state.

## System validation evidence log

1. UC-01_1: Empty registration submission
- Target: /register
- Input: Empty form submission
- Expected: Inline validation errors displayed for name, USN, email, password, branch, and semester.
- Actual: All field validation messages displayed.
- Screenshot: docs/reports/screenshots/UC-01_1_register_empty_form_errors.png
- Status: Pass

2. UC-01_2: Valid registration
- Target: /register
- Input: Ananya Rao, USN PES1UG24CS101, valid academic details and password.
- Expected: Success confirmation directing user to login.
- Actual: Registration successful message displayed.
- Screenshot: docs/reports/screenshots/UC-01_2_register_success.png
- Status: Pass

3. UC-01_3: Invalid login
- Target: /login
- Input: Correct email with incorrect password.
- Expected: Error message stating invalid credentials.
- Actual: Invalid email or password alert displayed.
- Screenshot: docs/reports/screenshots/UC-01_3_login_wrong_password.png
- Status: Pass

4. UC-01_4: Successful login
- Target: /login
- Input: Valid credentials for registered student.
- Expected: Redirect to student dashboard with navigation links.
- Actual: Dashboard loaded with account details.
- Screenshot: docs/reports/screenshots/UC-01_4_login_success_dashboard.png
- Status: Pass

5. UC-02_1: Initial profile state
- Target: /profile
- Input: View newly registered student profile.
- Expected: Profile completeness status marked as Incomplete.
- Actual: Incomplete status badge displayed.
- Screenshot: docs/reports/screenshots/UC-02_1_profile_incomplete.png
- Status: Pass

6. UC-02_2: Invalid resume file type
- Target: /profile
- Input: Upload file with .txt extension.
- Expected: Rejection message indicating PDF requirement.
- Actual: Only PDF files can be uploaded error displayed.
- Screenshot: docs/reports/screenshots/UC-02_2_resume_non_pdf_rejected.png
- Status: Pass

7. UC-02_3: Profile completion
- Target: /profile
- Input: Valid PDF resume, CGPA, and skill list.
- Expected: Profile completeness status marked as Complete.
- Actual: Complete badge displayed with uploaded resume metadata.
- Screenshot: docs/reports/screenshots/UC-02_3_profile_complete_with_resume.png
- Status: Pass

8. SR-04_1: Logout redirection
- Target: /profile following logout action
- Input: User logs out and navigates back to /profile.
- Expected: Redirect to login view.
- Actual: Login view presented.
- Screenshot: docs/reports/screenshots/SR-04_1_after_logout_profile_redirects_to_login.png
- Status: Pass

9. SR-04_2: Revoked token rejection
- Target: Protected API endpoint
- Input: Bearer token from terminated session.
- Expected: HTTP 401 Unauthorized response.
- Actual: 401 response returned with UNAUTHORIZED code.
- Screenshot: docs/reports/screenshots/SR-04_2_old_token_rejected_401.png
- Status: Pass

10. TEST_1: Unit test execution summary
- Target: Jest test runner
- Expected: All test suites and cases pass without regression.
- Actual: 151 tests passed across 11 baseline suites (extended to 163 tests across 12 suites with recruiter review).
- Screenshot: docs/reports/screenshots/TEST_1_unit_test_report_151_passed.png
- Status: Pass

11. TEST_2: Code coverage report
- Target: Istanbul / Jest coverage output
- Expected: Line coverage above 70%.
- Actual: 98.12% line coverage, 89.83% branch coverage.
- Screenshot: docs/reports/screenshots/TEST_2_code_and_branch_coverage.png
- Status: Pass

## Unresolved defects and open items

1. Applications table horizontal display on 360 pixel viewports
- Observed behavior: Table columns clip horizontally on narrow mobile screens.
- Current workaround: Horizontal card wrapping enabled via CSS table-wrap class.
- Planned action: Convert application rows to card layouts below 480 pixels.

2. Usability trial completion
- Pending item: Conducting structured five-student walkthrough according to checklist in NFR-02-Usability.md.
