/**
 * Jest configuration for the CampusReady API (Test Plan Section 5).
 * - Every test file gets its own temporary MongoDB (tests/setup.js), so tests never touch real data.
 * - Coverage reports line (code) coverage AND branch coverage for everything in src/.
 */
const path = require('path');

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 60000,

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // only starts the server; covered by manual runs, not unit tests
    '!src/config/db.js', // connection to the real database; tests use their own
  ],
  coverageReporters: ['html', 'text', 'text-summary', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',

  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: process.env.TEST_REPORT_DIR || path.join(__dirname, 'test-report'),
        filename: 'Unit_Test_Report.html',
        pageTitle: 'CampusReady - Unit and Integration Test Report',
        expand: true,
        hideIcon: true,
      },
    ],
  ],
};
