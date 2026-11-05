/**
 * Generates the Part 3 reports into docs/reports:
 *   docs/reports/Unit_Test_Report.html   - every test with pass/fail
 *   docs/reports/coverage/index.html     - line (code) and branch coverage
 * Usage: npm run test:report   (works the same on Windows and Mac)
 */
const path = require('path');
const { spawnSync } = require('child_process');

const reportsDir = path.join(__dirname, '..', '..', 'docs', 'reports');
const jestBin = require.resolve('jest/bin/jest');

const result = spawnSync(
  process.execPath,
  [jestBin, '--runInBand', '--coverage', `--coverageDirectory=${path.join(reportsDir, 'coverage')}`],
  { stdio: 'inherit', env: { ...process.env, TEST_REPORT_DIR: reportsDir } }
);

console.log(`\nReports written to ${reportsDir}`);
process.exit(result.status ?? 1);
