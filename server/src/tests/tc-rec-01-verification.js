/**
 * ============================================================================
 * TEST SUITE: TC-REC-01 | FR-07 RECRUITER LISTING LIFECYCLE & VALIDATION
 * ============================================================================
 * 
 * Module       : Recruiter Portal
 * Requirements : FR-07, BR-02, BR-03, SR-03
 * GitHub Issue : #13
 * Test Case    : TC-REC-01
 * ============================================================================
 */

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Listing = require('../models/Listing');
const { hashPassword } = require('../services/authService');
const ROLES = require('../utils/roles');

let mongoServer;
let server;
let baseUrl;

// Test accounts
let tokenRecruiterA;
let tokenRecruiterB;
let tokenStudent;
let createdListingId;

// Test results collector for final report
const testResults = [];

function recordResult(scenario, description, expected, actual, pass) {
  testResults.push({ scenario, description, expected, actual, pass });
  const statusBadge = pass ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`  ${statusBadge} ${scenario}: ${description}`);
  if (!pass) {
    console.log(`         Expected: ${expected}`);
    console.log(`         Actual  : ${actual}`);
  }
}

/** Helper to make HTTP requests against the live test server */
async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, data };
}

async function setup() {
  console.log('\n============================================================================');
  console.log('  CAMPUSREADY TEST RUNNER: TC-REC-01 VERIFICATION SUITE');
  console.log('  Owner: Sagar A Walikar (PES1UG24CS396) | Requirement: FR-07');
  console.log('============================================================================\n');

  console.log('-> Starting ephemeral MongoDB Memory Server...');
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Start test Express server on dynamic port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  console.log(`-> Test server active at: ${baseUrl}`);
  console.log('-> Seeding test fixture users (Recruiter A, Recruiter B, Student)...');

  // Seed Recruiter A (Sagar Walikar)
  await User.create({
    name: 'Sagar Walikar (Google Recruiter)',
    email: 'sagar.recruiter@google.com',
    company: 'Google',
    role: ROLES.RECRUITER,
    passwordHash: await hashPassword('Password@123'),
  });

  // Seed Recruiter B (Amazon Recruiter - for ownership isolation testing)
  await User.create({
    name: 'Amazon Recruiter',
    email: 'recruiter.b@amazon.com',
    company: 'Amazon',
    role: ROLES.RECRUITER,
    passwordHash: await hashPassword('Password@123'),
  });

  // Seed Student (for unauthorized role testing)
  await User.create({
    name: 'Student User',
    email: 'student@pes.edu',
    role: ROLES.STUDENT,
    passwordHash: await hashPassword('Password@123'),
  });

  console.log('-> Environment ready. Running test scenarios...\n');
}

async function runTests() {
  // --------------------------------------------------------------------------
  // SCENARIO 1: Recruiter Authentication
  // --------------------------------------------------------------------------
  console.log('\x1b[36m--- Scenario 1: Authentication & Role Token Generation ---\x1b[0m');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'sagar.recruiter@google.com',
    password: 'Password@123',
  });

  const authSuccess =
    loginRes.status === 200 &&
    Boolean(loginRes.data?.data?.token) &&
    loginRes.data?.data?.user?.role === 'Recruiter';
  tokenRecruiterA = loginRes.data?.data?.token;

  // Also obtain Recruiter B and Student tokens for subsequent guards
  const loginB = await request('POST', '/api/auth/login', { email: 'recruiter.b@amazon.com', password: 'Password@123' });
  tokenRecruiterB = loginB.data?.data?.token;

  const loginStudent = await request('POST', '/api/auth/login', { email: 'student@pes.edu', password: 'Password@123' });
  tokenStudent = loginStudent.data?.data?.token;

  recordResult(
    'Scenario 1',
    'Recruiter logs in and receives JWT token with role="Recruiter"',
    'HTTP 200 with JWT token',
    `HTTP ${loginRes.status} (token received: ${Boolean(tokenRecruiterA)})`,
    authSuccess
  );

  // --------------------------------------------------------------------------
  // SCENARIO 2: Create Listing as Draft & Pending Approval (FR-07)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Scenario 2: Create Job Listing (Initial Draft State) ---\x1b[0m');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const listingPayload = {
    title: 'Software Development Engineer Intern (Summer 2027)',
    role: 'SDE Intern',
    type: 'Internship',
    location: 'Bengaluru, India (Hybrid)',
    description: 'Join the Google Core Systems team to build high-throughput distributed infrastructure.',
    eligibility: 'B.Tech CSE/ISE with CGPA >= 8.0, proficient in C++ or Java.',
    deadline: futureDate.toISOString(),
  };

  const createRes = await request('POST', '/api/listings', listingPayload, tokenRecruiterA);
  const created = createRes.data?.data;
  createdListingId = created?._id;

  const isDraftAndPending =
    createRes.status === 201 &&
    created?.status === 'Draft' &&
    created?.approvalStatus === 'Pending' &&
    created?.company === 'Google';

  recordResult(
    'Scenario 2',
    'Create valid listing -> Saved as Draft & Pending approval (FR-07, BR-02)',
    'HTTP 201, status: "Draft", approvalStatus: "Pending"',
    `HTTP ${createRes.status}, status: "${created?.status}", approvalStatus: "${created?.approvalStatus}"`,
    isDraftAndPending
  );

  // --------------------------------------------------------------------------
  // SCENARIO 3: Publish Listing (FR-07: Draft -> Published)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Scenario 3: Recruiter Publishes the Listing ---\x1b[0m');
  const publishRes = await request(
    'PATCH',
    `/api/listings/${createdListingId}/publish`,
    { action: 'publish' },
    tokenRecruiterA
  );

  const isPublished = publishRes.status === 200 && publishRes.data?.data?.status === 'Published';

  recordResult(
    'Scenario 3',
    'Publish listing -> State transitions from Draft to Published (FR-07)',
    'HTTP 200, status: "Published"',
    `HTTP ${publishRes.status}, status: "${publishRes.data?.data?.status}"`,
    isPublished
  );

  // --------------------------------------------------------------------------
  // SCENARIO 4: Edit Listing Details & Persistence (FR-07)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Scenario 4: Recruiter Edits Listing Details ---\x1b[0m');
  const updatePayload = {
    role: 'Senior SDE Intern (Core Infrastructure)',
    eligibility: 'B.Tech CSE/ISE/ECE with CGPA >= 8.5.',
  };

  const editRes = await request('PUT', `/api/listings/${createdListingId}`, updatePayload, tokenRecruiterA);
  const isEdited =
    editRes.status === 200 &&
    editRes.data?.data?.role === updatePayload.role &&
    editRes.data?.data?.eligibility === updatePayload.eligibility;

  recordResult(
    'Scenario 4',
    'Edit listing -> Updates are persisted to MongoDB (FR-07)',
    'HTTP 200, updated role & eligibility persisted',
    `HTTP ${editRes.status}, role: "${editRes.data?.data?.role}"`,
    isEdited
  );

  // --------------------------------------------------------------------------
  // SCENARIO 5: Validation Failures & Edge Cases (HTTP 400 Bad Request)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Scenario 5: Input Validation & Edge Case Rejections (400) ---\x1b[0m');
  
  // 5a. Missing mandatory title
  const missingTitleRes = await request(
    'POST',
    '/api/listings',
    {
      role: 'SDE',
      location: 'Bengaluru',
      description: 'Test description',
      deadline: futureDate.toISOString(),
    },
    tokenRecruiterA
  );

  // 5b. Deadline set in the past
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);
  const pastDeadlineRes = await request(
    'POST',
    '/api/listings',
    {
      title: 'Invalid Past Listing',
      role: 'SDE',
      location: 'Bengaluru',
      description: 'Test description',
      deadline: pastDate.toISOString(),
    },
    tokenRecruiterA
  );

  const validationPassed = missingTitleRes.status === 400 && pastDeadlineRes.status === 400;

  recordResult(
    'Scenario 5',
    'Invalid input (missing title / past deadline) rejected with HTTP 400',
    'HTTP 400 Bad Request on both validation errors',
    `Missing title: HTTP ${missingTitleRes.status}, Past deadline: HTTP ${pastDeadlineRes.status}`,
    validationPassed
  );

  // --------------------------------------------------------------------------
  // SCENARIO 6: Server-Side Role Guard (SR-03 RBAC)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Scenario 6: Role Guard (Students Blocked from Creating Listings) ---\x1b[0m');
  const studentAttemptRes = await request('POST', '/api/listings', listingPayload, tokenStudent);
  const roleGuardPassed = studentAttemptRes.status === 403;

  recordResult(
    'Scenario 6',
    'Student token blocked from creating listings (SR-03 server-side RBAC)',
    'HTTP 403 Forbidden',
    `HTTP ${studentAttemptRes.status} (${studentAttemptRes.data?.errorCode || 'FORBIDDEN'})`,
    roleGuardPassed
  );

  // --------------------------------------------------------------------------
  // SCENARIO 7: Server-Side Ownership Guard (BR-03 Recruiter Isolation)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Scenario 7: Ownership Guard (Recruiter B cannot edit Recruiter A listing) ---\x1b[0m');
  const recruiterBAttemptRes = await request(
    'PUT',
    `/api/listings/${createdListingId}`,
    { title: 'Malicious Hijacked Title' },
    tokenRecruiterB
  );
  const ownershipGuardPassed = recruiterBAttemptRes.status === 403;

  recordResult(
    'Scenario 7',
    'Recruiter B prevented from modifying Recruiter A listing (BR-03 Isolation)',
    'HTTP 403 Forbidden',
    `HTTP ${recruiterBAttemptRes.status} (${recruiterBAttemptRes.data?.message || 'FORBIDDEN'})`,
    ownershipGuardPassed
  );
}

async function teardown() {
  console.log('\n============================================================================');
  console.log('  TEST EXECUTION SUMMARY');
  console.log('============================================================================');

  const total = testResults.length;
  const passed = testResults.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log(`  Total Scenarios Executed : ${total}`);
  console.log(`  Passed                   : \x1b[32m${passed}\x1b[0m`);
  console.log(`  Failed                   : ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '0'}`);
  console.log(`  Test Case TC-REC-01 Status: ${failed === 0 ? '\x1b[32mPASSED (100%)\x1b[0m' : '\x1b[31mFAILED\x1b[0m'}`);
  console.log('============================================================================\n');

  if (server) server.close();
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();

  if (failed > 0) process.exit(1);
}

async function main() {
  try {
    await setup();
    await runTests();
  } catch (err) {
    console.error('\x1b[31mError during test execution:\x1b[0m', err);
    process.exit(1);
  } finally {
    await teardown();
  }
}

main();
