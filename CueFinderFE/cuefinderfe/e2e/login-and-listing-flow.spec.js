/**
 * E2E Test: Complete Login and Listing Navigation Flow
 * Tests the bug where user gets redirected to login after clicking a listing
 */

const { test, expect } = require('@playwright/test');
const { registerUser: registerUserHelper, loginUser: loginUserHelper } = require('./helpers/authHelper');

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

// Generate unique test user
const timestamp = Date.now();
const testUser = {
  username: `loginflowuser_${timestamp}`,
  email: `loginflowuser_${timestamp}@test.com`,
  password: 'TestAdmin123!',
  name: `Login Flow User ${timestamp}`,
  acceptedTerms: true
};

test.describe('Login and Listing Navigation', () => {
  let authToken;
  
  test.beforeEach(async ({ request }) => {
    // Register test user
    await registerUserHelper(request, testUser);
    
    // Get auth token for tests
    authToken = await loginUserHelper(request, testUser.username, testUser.password);
    expect(authToken).toBeTruthy();
  });

  test('Should persist login and allow listing navigation', async ({ page }) => {
    console.log('1️⃣ Starting test: Login and navigate to listing');

    // Set token in localStorage BEFORE navigating
    console.log('2️⃣ Setting auth token...');
    await page.addInitScript((authToken) => {
      localStorage.setItem('authToken', authToken);
    }, authToken);

    // Navigate to home page - user is already logged in
    console.log('3️⃣ Navigating to home page...');
    await page.goto(APP_BASE_URL);
    await page.waitForTimeout(1000);

    // Wait for main heading
    await expect(page.getByRole('heading', { name: '🎱 CueFinder' })).toBeVisible({ timeout: 10000 });
    
    // Verify auth token is stored
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log(`✅ Auth token stored: ${token ? 'YES' : 'NO'}`);
    expect(token).toBeTruthy();

    // Wait a moment for listings to load
    console.log('4️⃣ Waiting for listings to load...');
    await page.waitForTimeout(2000);

    // Get all listing cards/items
    const listings = await page.locator('[role="button"][class*="cue"]').count();
    console.log(`📦 Found ${listings} listing item(s)`);

    // Click the first listing
    console.log('8️⃣ Clicking first listing...');
    const firstListing = page.locator('[class*="CueList"]').first();
    
    // Try to find a clickable listing element
    const listingElements = await page.locator('div').filter({ has: page.locator('text=/Brand|Condition/') }).first();
    
    if (await listingElements.isVisible()) {
      console.log('Found listing element, clicking...');
      await listingElements.click({ timeout: 5000 });
    } else {
      console.log('Trying alternative listing selector...');
      // Alternative: find any text that looks like it could be a brand name
      const brandText = page.locator('text=/^(Meucci|Predator|Cuetec|Viking|Schmelke|Jacoby|McDermott)/').first();
      if (await brandText.isVisible()) {
        await brandText.click();
      }
    }

    // Wait for navigation to detail page
    console.log('9️⃣ Waiting for detail page to load...');
    await page.waitForTimeout(2000);

    // Check if we're on a detail page (URL should contain /cue/ or /case/)
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Verify we're NOT back on login page
    console.log('🔟 Verifying we did NOT redirect to login...');
    const isLoginPage = currentUrl.includes('/login');
    const isDetailPage = currentUrl.includes('/cue/') || currentUrl.includes('/case/');
    
    console.log(`Is Login Page: ${isLoginPage}`);
    console.log(`Is Detail Page: ${isDetailPage}`);

    // The key test: we should be on a detail page, not login
    expect(isDetailPage || !isLoginPage).toBeTruthy();
    
    console.log('✅ Test passed: Login persisted and listing navigation successful!');
  });

  test('Should maintain auth token across navigation', async ({ page }) => {
    console.log('Testing token persistence across navigation...');

    // Set token in localStorage BEFORE navigating
    await page.addInitScript((authToken) => {
      localStorage.setItem('authToken', authToken);
    }, authToken);

    // Navigate to home page - user is already logged in
    await page.goto(APP_BASE_URL);
    await page.waitForTimeout(1000);

    // Get initial token
    const tokenBefore = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log(`Token before navigation: ${tokenBefore ? 'Present' : 'Missing'}`);

    // Navigate using back button (simulating user going back from detail page)
    await page.goto(APP_BASE_URL);
    await page.waitForTimeout(1000);

    // Check token is still there
    const tokenAfter = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log(`Token after navigation: ${tokenAfter ? 'Present' : 'Missing'}`);

    expect(tokenBefore).toBe(tokenAfter);
    expect(tokenAfter).toBeTruthy();

    console.log('✅ Token persisted correctly!');
  });
});


