/**
 * E2E Test Runner Script
 * 
 * Runs all e2e tests with reporting and cleanup
 * Usage:
 *   npx node e2e/run-tests.js
 *   npx node e2e/run-tests.js --headed    // Show browser
 *   npx node e2e/run-tests.js --debug     // Debug mode
 *   npx node e2e/run-tests.js --ui        // UI mode
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isHeaded = args.includes('--headed');
const isDebug = args.includes('--debug');
const isUI = args.includes('--ui');

const testDir = path.dirname(__filename);
const reportDir = path.join(testDir, '../test-results');

// Ensure report directory exists
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           CueFinder E2E Test Suite Runner                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const tests = [
  {
    name: 'Auth & User Journey',
    file: 'complete-user-journey.spec.js',
    description: 'Register, Login, Add Items, Edit Profile'
  },
  {
    name: 'Forum',
    file: 'forum-complete-flow.spec.js',
    description: 'Create Topics, Reply, Verify Visibility'
  },
  {
    name: 'UI Components',
    file: 'ui-components-visibility.spec.js',
    description: 'Menus, Bars, Dropdowns, Modals'
  }
];

console.log('📋 Available Tests:\n');
tests.forEach((test, i) => {
  console.log(`  ${i + 1}. ${test.name}`);
  console.log(`     - ${test.description}`);
  console.log(`     - File: ${test.file}\n`);
});

console.log('⚙️  Configuration:\n');
console.log(`  Mode: ${isUI ? 'UI (Interactive)' : isDebug ? 'Debug' : isHeaded ? 'Headed' : 'Headless'}`);
console.log(`  Report: ${reportDir}`);
console.log(`  Timestamp: ${new Date().toISOString()}\n`);

// Build playwright arguments
const playwrightArgs = ['test'];
const testPatterns = tests.map(t => path.join(testDir, t.file));

playwrightArgs.push(...testPatterns);

if (isHeaded) {
  playwrightArgs.push('--headed');
}

if (isDebug) {
  playwrightArgs.push('--debug');
}

if (isUI) {
  playwrightArgs.push('--ui');
}

playwrightArgs.push('--reporter=html');

console.log('🚀 Starting test execution...\n');

// Run playwright test
const testProcess = spawn('npx', ['@playwright/test', ...playwrightArgs], {
  cwd: testDir,
  stdio: 'inherit',
  shell: true
});

let exitCode = 0;

testProcess.on('error', (err) => {
  console.error('\n❌ Error running tests:', err);
  exitCode = 1;
});

testProcess.on('close', (code) => {
  exitCode = code || 0;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Execution Complete                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (exitCode === 0) {
    console.log('✅ All tests completed successfully!\n');
  } else {
    console.log('⚠️  Some tests failed or encountered errors.\n');
  }

  console.log('📊 Reports and screenshots:');
  console.log(`  Location: ${reportDir}`);
  console.log(`  HTML Report: npx playwright show-report\n`);

  console.log('💡 Tips:');
  console.log('  • View detailed HTML report: npm run test:report');
  console.log('  • Run with browser visible: npx node e2e/run-tests.js --headed');
  console.log('  • Debug mode: npx node e2e/run-tests.js --debug');
  console.log('  • Interactive UI: npx node e2e/run-tests.js --ui\n');

  process.exit(exitCode);
});
