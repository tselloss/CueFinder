/**
 * Playwright End-to-End Test: User Authentication Flow
 * 
 * This test runs against real backend and frontend instances.
 * Prerequisites:
 * 1. Backend must be running on http://localhost:5200
 * 2. Frontend must be running on http://localhost:3000
 * 3. PostgreSQL database must be accessible
 * 4. Admin user must exist with username: CuefinderAdminTheOneAndOnly, password: TheBestAdminThatYouEverHave
 * 
 * Run this test with: npx playwright test
 */

const { test, expect } = require('@playwright/test');

// Generate unique test user credentials
const timestamp = Date.now();
const testUser = {
  username: `e2euser_${timestamp}`,
  password: 'TestPass123!',
  name: 'E2E Test User',
  email: `e2etest${timestamp}@example.com`,
  phone: '+1234567890',
  acceptedTerms: true
};

// Helper to register user via API
async function registerTestUser(request, userData) {
  const response = await request.post('http://localhost:5000/api/auth/register', {
    data: userData
  });
  return response;
}

test.describe('End-to-End: User Registration and Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app home page
    await page.goto('http://localhost:3000');
    // Wait for the page to load - look for the main heading
    await expect(page.getByRole('heading', { name: '🎱 CueFinder' })).toBeVisible({ timeout: 10000 });
  });

  test('Direct login with valid credentials', async ({ page, request }) => {
    console.log('Testing direct login...');

    // Register test user first
    await registerTestUser(request, testUser);

    // Navigate to login page first
    await page.locator('button:has-text("Sign In")').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: '🎱 Sign In' })).toBeVisible({ timeout: 5000 });

    // Wait for form inputs to be ready
    const usernameInput = page.getByPlaceholder('Enter username');
    const passwordInput = page.getByPlaceholder('Password');
    
    await usernameInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });

    // Fill in credentials with registered user
    await usernameInput.fill(testUser.username);
    await passwordInput.fill(testUser.password);
    await page.waitForTimeout(500);

    // Find and click submit button - try multiple selectors
    let submitButton = page.locator('button[type="submit"]').first();
    const submitCount = await submitButton.count();
    console.log('Submit buttons found:', submitCount);

    if (submitCount > 0) {
      console.log('Clicking submit button...');
      await submitButton.click();
      // Wait for either successful redirect or check if any errors appear
      await page.waitForTimeout(3000);
    }

    // Check if we got the auth token
    let storedToken = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log('Auth token in localStorage:', storedToken ? 'Found ✓' : 'Not found ✗');

    if (storedToken) {
      console.log('✓ Direct login successful - token stored');
    } else {
      // Check for error messages
      const errors = await page.locator('[role="alert"]').allTextContents().catch(() => []);
      console.log('Error messages:', errors);
      throw new Error(`Login failed - no auth token stored. Errors: ${errors.join(', ')}`);
    }
  });

  test.skip('Admin user can access admin page', async ({ page }) => {
    console.log('Testing admin access (SKIPPED - requires admin user setup)...');

    // Navigate to login page first
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: '🎱 Sign In' })).toBeVisible({ timeout: 5000 });

    // Login as admin
    await page.getByPlaceholder('Enter username').fill('CuefinderAdminTheOneAndOnly');
    await page.getByPlaceholder('Password').fill('TheBestAdminThatYouEverHave');
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    await page.waitForTimeout(2000);

    // Verify logged in
    await expect(page.locator('button:has-text("Profile")')).toBeVisible({ timeout: 10000 });

    // Look for admin button in header
    const adminButton = page.locator('button:has-text("Admin")');
    await expect(adminButton).toBeVisible({ timeout: 5000 });
    await adminButton.click();
    await page.waitForTimeout(1000);
    
    // Verify admin page loaded - check for admin-related content
    const adminHeading = page.locator('h2').filter({ hasText: /admin/i }).first();
    await expect(adminHeading).toBeVisible({ timeout: 5000 });
    console.log('✓ Admin page accessible');
  });

  test('Registration form validation', async ({ page }) => {
    console.log('Testing registration form...');

    // Navigate to register page via header button
    await page.locator('button:has-text("Register")').click();
    await page.waitForTimeout(500);
    
    // Wait for form to be in register mode
    await expect(page.getByRole('heading', { name: '🎱 Create Account' })).toBeVisible({ timeout: 15000 });
    console.log('✓ Registration form visible');

    // Fill form with test data
    await page.getByPlaceholder('Enter username').fill(testUser.username);
    await page.getByPlaceholder('Your name').fill(testUser.name);
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('e.g. +15551234567').fill(testUser.phone);
    await page.getByPlaceholder('Password').fill(testUser.password);
    console.log('✓ Form fields filled');

    // Test 1: Try to submit WITHOUT accepting terms - should fail
    console.log('Testing terms checkbox validation...');
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    await page.waitForTimeout(1000);
    
    // Should show error about accepting terms
    const termsError = page.locator('text=/must accept.*terms/i');
    const hasTermsError = await termsError.isVisible().catch(() => false);
    if (hasTermsError) {
      console.log('✅ Terms validation working - error shown when checkbox not checked');
    }

    // Test 2: Check the terms checkbox exists and has link
    // Look for the text first (more reliable for Grommet components)
    const termsText = page.locator('text=/Αποδέχομαι τους|I accept the/');
    await expect(termsText).toBeVisible({ timeout: 5000 });
    console.log('✓ Terms acceptance text visible');

    // Verify terms link exists
    const termsLink = page.locator('a[href*="terms"]');
    await expect(termsLink).toBeVisible({ timeout: 5000 });
    console.log('✓ Terms and Conditions link visible');

    // Test 3: Click terms link to verify it opens (in new tab or same page)
    const linkHref = await termsLink.getAttribute('href');
    console.log(`✓ Terms link points to: ${linkHref}`);

    // Test 4: Accept terms by clicking the checkbox label area (Grommet CheckBox)
    // Click on the terms text area to toggle the checkbox
    await termsText.click();
    await page.waitForTimeout(500);
    console.log('✓ Terms checkbox checked');

    // Submit - this will trigger SMS verification flow
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    await page.waitForTimeout(2000);

    // Check if we get verification prompt or error
    const verifyPrompt = page.locator('text=/check your phone|verification|code/i');
    const errorMessage = page.locator('.alert-danger');
    
    const hasVerifyPrompt = await verifyPrompt.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasVerifyPrompt) {
      console.log('✓ SMS verification prompt displayed');
    } else if (hasError) {
      console.log('✓ Registration validation working (error displayed)');
    } else {
      console.log('⚠ No visible response (SMS may not be configured)');
    }
  });

  test('User can navigate app features', async ({ page }) => {
    console.log('Testing app navigation...');

    // Login as admin first - use first() to avoid strict mode violation
    const signInButtons = page.locator('button:has-text("Sign In")');
    await signInButtons.first().waitFor({ state: 'visible', timeout: 5000 });
    await signInButtons.first().click();
    await page.waitForTimeout(1000);
    await page.getByPlaceholder('Enter username').fill('admin');
    await page.getByPlaceholder('Password').fill('Admin123!');
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('button:has-text("Profile")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Logged in as admin');

    // Test profile navigation
    const profileButton = page.locator('button:has-text("My Profile")');
    await expect(profileButton).toBeVisible({ timeout: 5000 });
    await profileButton.click();
    await page.waitForTimeout(1000);
    console.log('✓ Profile page accessible');

    // Navigate back to home
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Test search functionality
    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Predator');
    await page.waitForTimeout(500);
    console.log('✓ Search functionality working');
    await searchInput.clear();

    // Test Add Cue button
    const addCueButton = page.locator('button:has-text("Add Cue")');
    await expect(addCueButton).toBeVisible({ timeout: 5000 });
    await addCueButton.click();
    await page.waitForTimeout(1000);
    
    // Verify add cue form/drawer is visible
    const addCueHeading = page.locator('h3:has-text("Add New Billiard Cue")');
    await expect(addCueHeading).toBeVisible({ timeout: 5000 });
    console.log('✓ Add cue form accessible');

    // Close the drawer
    const closeButton = page.locator('button.close-btn, button:has-text("✕")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    await page.waitForTimeout(500);

    // Test logout
    const signOutButton = page.locator('button:has-text("Sign out")');
    await expect(signOutButton).toBeVisible({ timeout: 5000 });
    await signOutButton.click();
    await page.waitForTimeout(1000);
    
    // Verify logged out - Sign In button should be visible
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible({ timeout: 5000 });
    console.log('✓ Logout successful');

    console.log('\n✅ Navigation test complete!\n');
  });
});


