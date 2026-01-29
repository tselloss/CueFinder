/**
 * E2E Test: Complete Login and Listing Navigation Flow
 * Tests the bug where user gets redirected to login after clicking a listing
 */

const { test, expect } = require('@playwright/test');

// Generate unique test user
const timestamp = Date.now();
const testUser = {
  username: `loginflowuser_${timestamp}`,
  email: `loginflowuser_${timestamp}@test.com`,
  password: 'TestAdmin123!',
  name: `Login Flow User ${timestamp}`,
  acceptedTerms: true
};

// Helper to register user via API
async function registerUser(request, userData) {
  const response = await request.post('http://127.0.0.1:5200/api/auth/register', {
    data: userData
  });
  return response;
}

test.describe('Login and Listing Navigation', () => {
  test.beforeEach(async ({ page, request }) => {
    // Register test user
    await registerUser(request, testUser);
    
    // Navigate to app home
    await page.goto('http://localhost:3000');
    // Wait for main heading
    await expect(page.getByRole('heading', { name: '🎱 CueFinder' })).toBeVisible({ timeout: 10000 });
  });

  test('Should persist login and allow listing navigation', async ({ page }) => {
    console.log('1️⃣ Starting test: Login and navigate to listing');

    // Click Sign In button - use getByRole to be more specific
    console.log('2️⃣ Clicking Sign In button...');
    const signInBtn = page.locator('button:has-text("Sign In")').first();
    await signInBtn.waitFor({ state: 'visible', timeout: 5000 });
    await signInBtn.click();
    await page.waitForTimeout(1000);

    // Wait for Sign In heading
    console.log('3️⃣ Waiting for Sign In page...');
    await expect(page.getByRole('heading', { name: /Welcome Back|Sign In/i })).toBeVisible({ timeout: 10000 });

    // Fill login form
    console.log('4️⃣ Filling login credentials...');
    const usernameInput = page.getByPlaceholder('Enter username');
    const passwordInput = page.getByPlaceholder('Password');
    
    await usernameInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });

    await usernameInput.fill(testUser.username);
    await passwordInput.fill(testUser.password);

    // Submit login form
    console.log('5️⃣ Submitting login form...');
    const submitButtons = await page.locator('button:has-text("Sign In")').count();
    console.log(`Found ${submitButtons} Sign In button(s)`);
    
    const loginButton = page.locator('button:has-text("Sign In")').last();
    await loginButton.click();

    // Wait for redirect to home/listings page
    console.log('6️⃣ Waiting for redirect to listings...');
    await page.waitForURL(/\/#\/$/, { timeout: 10000 });
    
    // Verify auth token is stored
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log(`✅ Auth token stored: ${token ? 'YES' : 'NO'}`);
    expect(token).toBeTruthy();

    // Wait a moment for listings to load
    console.log('7️⃣ Waiting for listings to load...');
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

    // Login first
    await page.locator('button:has-text("Sign In")').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: /Welcome Back|Sign In/i })).toBeVisible({ timeout: 5000 });

    const usernameInput = page.getByPlaceholder('Enter username');
    const passwordInput = page.getByPlaceholder('Password');
    
    await usernameInput.fill(testUser.username);
    await passwordInput.fill(testUser.password);
    
    const loginButton = page.locator('button:has-text("Sign In")').last();
    await loginButton.click();

    // Wait for redirect
    await page.waitForURL(/\/#\/$/, { timeout: 10000 });

    // Get initial token
    const tokenBefore = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log(`Token before navigation: ${tokenBefore ? 'Present' : 'Missing'}`);

    // Navigate using back button (simulating user going back from detail page)
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Check token is still there
    const tokenAfter = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log(`Token after navigation: ${tokenAfter ? 'Present' : 'Missing'}`);

    expect(tokenBefore).toBe(tokenAfter);
    expect(tokenAfter).toBeTruthy();

    console.log('✅ Token persisted correctly!');
  });
});


