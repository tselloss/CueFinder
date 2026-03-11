/**
 * Playwright Configuration
 * 
 * Configure Playwright for end-to-end testing
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 600000, // Increased to 600 seconds (10 minutes) to allow slow network and slow-mo browser
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on', // Always take screenshots
    video: 'retain-on-failure',
    actionTimeout: 30000, // Increased from 20s to 30s for slower operations
    navigationTimeout: 90000, // Increased from 60s to 90s for slower page loads
    expect: {
      timeout: 30000, // Increased from 20s to 30s for assertions
    },
    offline: false,
    ignoreHTTPSErrors: true,
    // Allow JavaScript to access localStorage and sessionStorage
    javaScriptEnabled: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 500, // Slow down by 500ms for better visibility
        },
        // Enable storage for this context
        storageState: undefined,
      },
    },
  ],

  // Don't start servers automatically - require manual start
  // Uncomment below to auto-start servers
  /*
  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  */
});
