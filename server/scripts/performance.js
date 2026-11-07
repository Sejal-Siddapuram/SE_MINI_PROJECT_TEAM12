/* Disposable performance environment: never connects to MONGO_URI or an existing database. */
process.env.NODE_ENV = 'test';
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Application = require('../src/models/Application');
const { JWT_SECRET } = require('../src/config/env');
const { performance } = require('perf_hooks');

const durationSeconds = Number(process.env.PERF_SECONDS || 300);
const concurrency = Number(process.env.PERF_USERS || 50);
if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || !Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error('PERF_SECONDS and PERF_USERS must be positive integers.');
}
function percentile(samples, p) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] || 0;
}
function hasIndexScan(value) {
  if (!value || typeof value !== 'object') return false;
  return value.stage === 'IXSCAN' || Object.values(value).some(hasIndexScan);
}
async function main() {
  let mongo, server, browser;
  const samples = { search: [], dashboard: [] };
  const errors = [];
  const started = new Date().toISOString();
  const reportPath = path.resolve(__dirname, '../../docs/reports/Performance_Results.json');
  try {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'campusready_performance' });
    await Promise.all([User.init(), Listing.init(), Application.init()]);
    const users = await User.insertMany(Array.from({ length: 102 }, (_, i) => ({
      name: 'Performance user ' + i, email: 'perf' + i + '@test.edu', passwordHash: 'not-a-login-password',
      role: i === 0 ? 'Admin' : i === 1 ? 'Recruiter' : 'Student',
    })));
    const listings = await Listing.insertMany(Array.from({ length: 1000 }, (_, i) => ({
      recruiterId: users[1]._id, company: 'Performance Company', title: 'Role ' + i, role: 'Developer',
      location: 'Bengaluru', description: 'Performance fixture', deadline: new Date('2099-01-01'),
      status: 'Published', approvalStatus: 'Approved',
    })));
    await Application.insertMany(Array.from({ length: 10000 }, (_, i) => ({
      studentId: users[2 + i % 100]._id, listingId: listings[Math.floor(i / 100)]._id,
      status: i % 10 === 0 ? 'Selected' : 'Applied',
    })));
    const explanation = await Listing.find({ status: 'Published', approvalStatus: 'Approved' })
      .sort({ deadline: 1, _id: 1 }).limit(10).explain('executionStats');
    const indexUsed = hasIndexScan(explanation.queryPlanner.winningPlan);
    const app = require('../src/app');
    app.use(express.static(path.resolve(__dirname, '../../client/dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, '../../client/dist/index.html')));
    server = await new Promise((resolve) => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    const workers = await Promise.all(Array.from({ length: concurrency }, async (_, i) => {
      const user = i % 2 === 0 ? users[2 + i % 100] : users[0];
      const context = await browser.newContext();
      const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h', jwtid: require('crypto').randomUUID() });
      await context.addInitScript(({ token, user }) => {
        sessionStorage.setItem('campusready.token', token);
        sessionStorage.setItem('campusready.user', JSON.stringify(user));
      }, { token, user: { id: user.id, role: user.role, name: user.name, email: user.email } });
      return { context, page: await context.newPage(), kind: i % 2 === 0 ? 'search' : 'dashboard' };
    }));
    const start = performance.now();
    const end = start + durationSeconds * 1000;
    await Promise.all(workers.map(async ({ context, page, kind }) => {
      try {
        while (performance.now() < end) {
          const before = performance.now();
          try {
            const route = kind === 'search' ? '/listings' : '/admin/analytics';
            await page.goto(origin + route, { waitUntil: 'load', timeout: 20000 });
            if (kind === 'search') await page.getByText('1000 listings found', { exact: true }).waitFor({ timeout: 20000 });
            else {
              await page.getByRole('heading', { name: 'Selections', exact: true }).waitFor({ timeout: 20000 });
              await page.locator('.feature-grid .card p').filter({ hasText: /^10000$/ }).waitFor({ timeout: 20000 });
            }
            samples[kind].push(performance.now() - before);
          } catch (error) { errors.push({ kind, message: error.message }); }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } finally { await context.close(); }
    }));
    const elapsedSeconds = (performance.now() - start) / 1000;
    const timings = Object.fromEntries(Object.entries(samples).map(([kind, values]) => [kind, {
      completedLoads: values.length, p95Milliseconds: percentile(values, 0.95),
      maxMilliseconds: values.length ? Math.max(...values) : 0,
    }]));
    const report = {
      started, environment: { node: process.version, platform: process.platform, chromium: browser.version() },
      requestedDurationSeconds: durationSeconds, elapsedSeconds, concurrentUsers: concurrency,
      fixture: { students: 100, listings: 1000, applications: 10000, selections: 1000 },
      measurement: 'Full browser navigation until load and expected API-backed content is rendered; 100ms think time.',
      timings, errorCount: errors.length, errors: errors.slice(0, 20),
      searchIndexUsed: indexUsed, winningPlan: explanation.queryPlanner.winningPlan,
      passed: concurrency >= 50 && durationSeconds >= 300 && errors.length === 0 && indexUsed &&
        Object.values(timings).every((t) => t.completedLoads > 0 && t.p95Milliseconds <= 3000),
    };
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
