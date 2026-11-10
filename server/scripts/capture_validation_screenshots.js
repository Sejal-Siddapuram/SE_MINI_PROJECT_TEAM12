process.env.NODE_ENV = 'test';
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { chromium } = require('playwright');

const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const Listing = require('../src/models/Listing');
const Application = require('../src/models/Application');
const { hashPassword } = require('../src/services/authService');
const seedMockTests = require('../src/utils/seedMockTests');
const { JWT_SECRET } = require('../src/config/env');

const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/reports/screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function main() {
  let mongo, server, browser;
  try {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'campusready_screenshots' });
    await seedMockTests();

    // 1. Seed users
    const admin = await User.create({
      name: 'Dr. Ramesh Kumar',
      email: 'admin@campusready.edu',
      passwordHash: await hashPassword('Admin@1234'),
      role: 'Admin',
    });

    const recruiter = await User.create({
      name: 'Vikram Mehta',
      email: 'recruiter@techcorp.com',
      passwordHash: await hashPassword('Passw0rd123'),
      role: 'Recruiter',
      company: 'TechCorp Solutions',
    });

    const student = await User.create({
      name: 'Ananya Rao',
      email: 'ananya.rao@pesu.pes.edu',
      passwordHash: await hashPassword('Passw0rd123'),
      role: 'Student',
    });

    await StudentProfile.create({
      userId: student._id,
      usn: 'PES1UG24CS101',
      branch: 'CSE',
      semester: 5,
      cgpa: 8.75,
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      resumeUrl: 'ananya_resume.pdf',
    });

    // 2. Seed listings
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const listing1 = await Listing.create({
      recruiterId: recruiter._id,
      company: 'TechCorp Solutions',
      title: 'Software Development Engineer Intern',
      role: 'Software Engineer',
      type: 'Internship',
      location: 'Bengaluru',
      description: 'Design and build backend APIs, microservices, and distributed cloud applications.',
      eligibility: 'CGPA >= 7.5, CSE or ECE, Semester 5 or above',
      deadline,
      status: 'Published',
      approvalStatus: 'Approved',
    });

    const listing2 = await Listing.create({
      recruiterId: recruiter._id,
      company: 'TechCorp Solutions',
      title: 'Frontend Developer Intern',
      role: 'Frontend Engineer',
      type: 'Internship',
      location: 'Hyderabad',
      description: 'Build modern responsive single-page web applications with React and CSS design tokens.',
      eligibility: 'Knowledge of HTML, CSS, JavaScript, and React',
      deadline,
      status: 'Published',
      approvalStatus: 'Approved',
    });

    await Listing.create({
      recruiterId: recruiter._id,
      company: 'TechCorp Solutions',
      title: 'DevOps Engineer Intern',
      role: 'Cloud Engineer',
      type: 'Full-time',
      location: 'Bengaluru',
      description: 'Manage CI/CD pipelines, container orchestration, and server monitoring.',
      deadline,
      status: 'Draft',
      approvalStatus: 'Pending',
    });

    // 3. Seed application
    await Application.create({
      studentId: student._id,
      listingId: listing1._id,
      status: 'Shortlisted',
    });

    // 4. Start app serving static client build
    const app = require('../src/app');
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

    server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    console.log(`Test server running at ${baseUrl}`);

    // 5. Helper to create authenticated browser session
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
    });

    async function createSession(user) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const token = jwt.sign(
        { sub: user._id.toString(), role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '2h', jwtid: require('crypto').randomUUID() }
      );
      await context.addInitScript(
        ({ token, user }) => {
          sessionStorage.setItem('campusready.token', token);
          sessionStorage.setItem('campusready.user', JSON.stringify(user));
        },
        { token, user: { id: user._id.toString(), role: user.role, name: user.name, email: user.email } }
      );
      return context.newPage();
    }

    // Capture Student Views
    const studentPage = await createSession(student);

    // UC-04: Search & Filters
    await studentPage.goto(`${baseUrl}/listings`, { waitUntil: 'networkidle' });
    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-04_1_listing_search_and_filters.png') });
    console.log('Captured UC-04_1_listing_search_and_filters.png');

    // UC-05: Listing Details & Apply
    await studentPage.goto(`${baseUrl}/listings/${listing1._id}`, { waitUntil: 'networkidle' });
    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-05_1_student_apply_to_listing.png') });
    console.log('Captured UC-05_1_student_apply_to_listing.png');

    // UC-06: Student Applications
    await studentPage.goto(`${baseUrl}/applications`, { waitUntil: 'networkidle' });
    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-06_1_student_my_applications.png') });
    console.log('Captured UC-06_1_student_my_applications.png');

    // UC-12: Mock Aptitude Test
    await studentPage.goto(`${baseUrl}/mock-tests`, { waitUntil: 'networkidle' });
    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-12_1_mock_aptitude_test.png') });
    console.log('Captured UC-12_1_mock_aptitude_test.png');

    // Capture Recruiter Views
    const recruiterPage = await createSession(recruiter);

    // UC-07: Recruiter My Listings
    await recruiterPage.goto(`${baseUrl}/recruiter/listings`, { waitUntil: 'networkidle' });
    await recruiterPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-07_1_recruiter_my_listings.png') });
    console.log('Captured UC-07_1_recruiter_my_listings.png');

    // UC-08: Recruiter Applicants Review
    await recruiterPage.goto(`${baseUrl}/recruiter/listings/${listing1._id}/applicants`, { waitUntil: 'networkidle' });
    await recruiterPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-08_1_recruiter_applicant_review.png') });
    console.log('Captured UC-08_1_recruiter_applicant_review.png');

    // Capture Admin Views
    const adminPage = await createSession(admin);

    // UC-10: Admin Moderate Listings
    await adminPage.goto(`${baseUrl}/admin/listings`, { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-10_1_admin_moderation.png') });
    console.log('Captured UC-10_1_admin_moderation.png');

    // UC-11: Admin Analytics
    await adminPage.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'UC-11_1_admin_placement_analytics.png') });
    console.log('Captured UC-11_1_admin_placement_analytics.png');

    console.log('All screenshots captured successfully.');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
