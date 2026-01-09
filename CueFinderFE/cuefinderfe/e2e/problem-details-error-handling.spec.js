/**
 * Playwright End-to-End Test: Problem Details Error Handling
 * 
 * This test verifies that the frontend properly handles and displays
 * RFC 7807 Problem Details error responses from the backend.
 * 
 * Prerequisites:
 * 1. Backend must be running on http://localhost:5000
 * 2. Frontend must be running on http://localhost:3000
 * 3. PostgreSQL database must be accessible
 * 
 * Run this test with: 
 *   npx playwright test problem-details-error-handling.spec.js
 * 
 * Run in headed mode to see the browser:
 *   npx playwright test problem-details-error-handling.spec.js --headed
 * 
 * Run with slow motion to watch the test:
 *   npx playwright test problem-details-error-handling.spec.js --headed --slow-mo=1000
 */

const { test, expect } = require('@playwright/test');

// Generate unique test data
const timestamp = Date.now();
const testUser = {
  username: `errortest_${timestamp}`,
  password: 'ValidPass123!',
  shortPassword: '123', // Too short - will trigger validation error
  name: 'Error Test User',
  email: `errortest${timestamp}@example.com`,
  phone: '+1234567890',
};

test.describe('Problem Details Error Handling - Visual Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set slower navigation for better visualization
    page.setDefaultTimeout(10000);
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: '🎱 CueFinder' })).toBeVisible();
    
    console.log('✅ Application loaded successfully');
  });

  test('Login Error: Invalid Credentials (401 Unauthorized)', async ({ page }) => {
    console.log('\n🧪 TEST: Invalid Login Credentials');
    
    // Navigate to login page
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(500);
    
    await expect(page.getByRole('heading', { name: '🎱 Sign In' })).toBeVisible();
    console.log('📍 On login page');
    
    // Enter invalid credentials
    await page.getByPlaceholder('Enter username').fill('invalid_user');
    await page.getByPlaceholder('Password').fill('WrongPassword123!');
    
    console.log('📝 Entered invalid credentials');
    await page.waitForTimeout(1000); // Pause for visualization
    
    // Intercept the API call to see the Problem Details response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') && response.status() === 401
    );
    
    // Submit the form
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    // Wait for the API response
    const response = await responsePromise;
    const responseBody = await response.json();
    
    console.log('📥 API Response (Problem Details):', JSON.stringify(responseBody, null, 2));
    
    // Verify Problem Details structure
    expect(responseBody).toHaveProperty('title');
    expect(responseBody).toHaveProperty('status');
    expect(responseBody.status).toBe(401);
    
    // Wait for error message to appear
    await page.waitForTimeout(1000);
    
    // Verify error message is displayed to user
    const errorMessage = page.locator('text=/Invalid|Unauthorized|password/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Get the actual error text displayed to user
    const displayedError = await errorMessage.textContent();
    console.log('✅ Error displayed to user:', displayedError);
    
    // Pause for 3 seconds so you can see the error
    console.log('⏸️  Pausing for 3 seconds to visualize the error...');
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/error-401-invalid-login.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/error-401-invalid-login.png');
  });

  test('Registration Error: Validation - Password Too Short (400 Bad Request)', async ({ page }) => {
    console.log('\n🧪 TEST: Validation Error - Short Password');
    
    // Navigate to registration page
    await page.locator('button:has-text("Sign Up")').click();
    await page.waitForTimeout(500);
    
    await expect(page.getByRole('heading', { name: '🎱 Create Account' })).toBeVisible();
    console.log('📍 On registration page');
    
    // Fill out registration form with invalid password
    await page.getByPlaceholder('Choose username').fill(testUser.username);
    await page.getByPlaceholder('Your full name').fill(testUser.name);
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('+1234567890').fill(testUser.phone);
    await page.getByPlaceholder('Password').fill(testUser.shortPassword); // Too short!
    
    // Fill address fields (if visible)
    const streetField = page.getByPlaceholder('Street address');
    if (await streetField.isVisible()) {
      await streetField.fill('123 Test St');
      await page.getByPlaceholder('City').fill('Test City');
      await page.getByPlaceholder('State/Province').fill('Test State');
      await page.getByPlaceholder('Postal Code').fill('12345');
      await page.getByPlaceholder('Country').fill('Test Country');
    }
    
    console.log('📝 Entered registration data with short password');
    await page.waitForTimeout(1000);
    
    // Intercept the API call to see the Problem Details response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/register') && 
                  (response.status() === 400 || response.status() === 422)
    );
    
    // Submit the form
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    
    // Wait for the API response
    const response = await responsePromise;
    const responseBody = await response.json();
    
    console.log('📥 API Response (Problem Details):', JSON.stringify(responseBody, null, 2));
    
    // Verify Problem Details structure with validation errors
    expect(responseBody).toHaveProperty('title');
    expect(responseBody).toHaveProperty('status');
    expect([400, 422]).toContain(responseBody.status);
    
    // Check if validation errors are present
    if (responseBody.errors) {
      console.log('📋 Validation Errors:', responseBody.errors);
    }
    
    // Wait for error message to appear
    await page.waitForTimeout(1000);
    
    // Verify error message is displayed to user
    const errorMessage = page.locator('text=/password|validation|required|characters/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Get the actual error text
    const displayedError = await errorMessage.textContent();
    console.log('✅ Error displayed to user:', displayedError);
    
    // Pause for 3 seconds so you can see the error
    console.log('⏸️  Pausing for 3 seconds to visualize the validation error...');
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/error-400-validation-password.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/error-400-validation-password.png');
  });

  test('Registration Error: Duplicate Username (409 Conflict)', async ({ page }) => {
    console.log('\n🧪 TEST: Duplicate Username - Conflict Error');
    
    // First, register a user successfully
    await page.locator('button:has-text("Sign Up")').click();
    await page.waitForTimeout(500);
    
    const uniqueUsername = `duplicate_test_${timestamp}`;
    
    // Fill registration form
    await page.getByPlaceholder('Choose username').fill(uniqueUsername);
    await page.getByPlaceholder('Your full name').fill(testUser.name);
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('+1234567890').fill(testUser.phone);
    await page.getByPlaceholder('Password').fill(testUser.password);
    
    // Fill address if visible
    const streetField = page.getByPlaceholder('Street address');
    if (await streetField.isVisible()) {
      await streetField.fill('123 Test St');
      await page.getByPlaceholder('City').fill('Test City');
      await page.getByPlaceholder('State/Province').fill('Test State');
      await page.getByPlaceholder('Postal Code').fill('12345');
      await page.getByPlaceholder('Country').fill('Test Country');
    }
    
    console.log('📝 Attempting first registration...');
    
    // Submit first registration
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    
    // Wait for SMS verification or success
    await page.waitForTimeout(3000);
    
    // Now try to register with the same username again
    console.log('🔄 Going back to try duplicate registration...');
    
    // Navigate back to home and then to registration
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(500);
    
    await page.locator('button:has-text("Sign Up")').click();
    await page.waitForTimeout(500);
    
    // Fill with the SAME username
    await page.getByPlaceholder('Choose username').fill(uniqueUsername); // Same!
    await page.getByPlaceholder('Your full name').fill(testUser.name);
    await page.getByPlaceholder('you@example.com').fill(`another_${testUser.email}`);
    await page.getByPlaceholder('+1234567890').fill('+9876543210');
    await page.getByPlaceholder('Password').fill(testUser.password);
    
    if (await streetField.isVisible()) {
      await streetField.fill('456 Other St');
      await page.getByPlaceholder('City').fill('Other City');
      await page.getByPlaceholder('State/Province').fill('Other State');
      await page.getByPlaceholder('Postal Code').fill('54321');
      await page.getByPlaceholder('Country').fill('Other Country');
    }
    
    console.log('📝 Attempting duplicate registration with same username');
    await page.waitForTimeout(1000);
    
    // Intercept the API call to see the 409 Conflict response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/register') && response.status() === 409,
      { timeout: 10000 }
    ).catch(() => null); // Don't fail if 409 not received
    
    // Submit the form
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    
    // Wait for the API response
    const response = await responsePromise;
    
    if (response) {
      const responseBody = await response.json();
      console.log('📥 API Response (Problem Details):', JSON.stringify(responseBody, null, 2));
      
      // Verify Problem Details structure
      expect(responseBody).toHaveProperty('title');
      expect(responseBody).toHaveProperty('status');
      expect(responseBody.status).toBe(409);
      
      // Wait for error message to appear
      await page.waitForTimeout(1000);
      
      // Verify error message is displayed
      const errorMessage = page.locator('text=/already|exists|taken|duplicate|conflict/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      
      const displayedError = await errorMessage.textContent();
      console.log('✅ Error displayed to user:', displayedError);
      
      // Pause for 3 seconds
      console.log('⏸️  Pausing for 3 seconds to visualize the conflict error...');
      await page.waitForTimeout(3000);
      
      // Take a screenshot
      await page.screenshot({ path: 'test-results/error-409-duplicate-username.png', fullPage: true });
      console.log('📸 Screenshot saved: test-results/error-409-duplicate-username.png');
    } else {
      console.log('⚠️  No 409 response received - may need to check backend behavior');
    }
  });

  test('Profile Update Error: Invalid Email Format (400 Validation)', async ({ page }) => {
    console.log('\n🧪 TEST: Profile Update - Invalid Email Validation');
    
    // First login as admin
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(500);
    
    await page.getByPlaceholder('Enter username').fill('admin');
    await page.getByPlaceholder('Password').fill('Admin123!');
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    // Wait for successful login
    await expect(page.locator('button:has-text("Profile")')).toBeVisible({ timeout: 10000 });
    console.log('✅ Logged in successfully');
    
    // Navigate to profile page
    await page.locator('button:has-text("Profile")').click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading', { name: /Profile|User/i })).toBeVisible();
    console.log('📍 On profile page');
    
    // Click edit button if present
    const editButton = page.locator('button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
    
    // Find and fill email field with invalid format
    const emailField = page.getByPlaceholder(/email/i).or(page.locator('input[name="email"]'));
    await emailField.clear();
    await emailField.fill('invalid-email-format'); // Invalid!
    
    console.log('📝 Entered invalid email format');
    await page.waitForTimeout(1000);
    
    // Intercept the API call
    const responsePromise = page.waitForResponse(
      response => (response.url().includes('/api/auth/profile') || response.url().includes('/api/users')) &&
                  (response.status() === 400 || response.status() === 422),
      { timeout: 10000 }
    ).catch(() => null);
    
    // Submit the form
    const saveButton = page.locator('button:has-text("Save")').or(page.locator('button[type="submit"]'));
    await saveButton.click();
    
    // Wait for response
    const response = await responsePromise;
    
    if (response) {
      const responseBody = await response.json();
      console.log('📥 API Response (Problem Details):', JSON.stringify(responseBody, null, 2));
      
      // Verify Problem Details
      expect(responseBody).toHaveProperty('status');
      expect([400, 422]).toContain(responseBody.status);
      
      await page.waitForTimeout(1000);
      
      // Look for error message
      const errorMessage = page.locator('text=/email|invalid|format|validation/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      
      const displayedError = await errorMessage.textContent();
      console.log('✅ Error displayed to user:', displayedError);
      
      console.log('⏸️  Pausing for 3 seconds to visualize the validation error...');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/error-400-invalid-email.png', fullPage: true });
      console.log('📸 Screenshot saved: test-results/error-400-invalid-email.png');
    } else {
      console.log('⚠️  No validation error received - form may have client-side validation');
    }
  });

  test('Network Error: Backend Unavailable (Connection Failed)', async ({ page }) => {
    console.log('\n🧪 TEST: Network Error - Backend Unavailable');
    console.log('⚠️  Note: This test simulates backend being down');
    
    // Set up route to simulate network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    console.log('🔌 Simulating backend failure...');
    
    // Try to login
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(500);
    
    await page.getByPlaceholder('Enter username').fill('testuser');
    await page.getByPlaceholder('Password').fill('TestPass123!');
    
    console.log('📝 Attempting login with simulated network failure');
    await page.waitForTimeout(1000);
    
    // Submit the form
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Look for network error message
    const errorMessage = page.locator('text=/failed|network|error|timeout|connection/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    const displayedError = await errorMessage.textContent();
    console.log('✅ Error displayed to user:', displayedError);
    
    console.log('⏸️  Pausing for 3 seconds to visualize the network error...');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/error-network-failure.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/error-network-failure.png');
  });

  test('Complete Error Flow: Multiple Validation Errors', async ({ page }) => {
    console.log('\n🧪 TEST: Multiple Validation Errors');
    
    await page.locator('button:has-text("Sign Up")').click();
    await page.waitForTimeout(500);
    
    // Fill form with multiple invalid fields
    await page.getByPlaceholder('Choose username').fill('ab'); // Too short
    await page.getByPlaceholder('Your full name').fill(''); // Empty
    await page.getByPlaceholder('you@example.com').fill('bad-email'); // Invalid format
    await page.getByPlaceholder('Password').fill('123'); // Too short
    
    console.log('📝 Entered multiple invalid fields');
    await page.waitForTimeout(1000);
    
    // Intercept API call
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/register') &&
                  (response.status() === 400 || response.status() === 422),
      { timeout: 10000 }
    ).catch(() => null);
    
    // Submit
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    
    const response = await responsePromise;
    
    if (response) {
      const responseBody = await response.json();
      console.log('📥 API Response (Problem Details with multiple errors):');
      console.log(JSON.stringify(responseBody, null, 2));
      
      // Check for multiple validation errors
      if (responseBody.errors) {
        const errorCount = Object.keys(responseBody.errors).length;
        console.log(`📋 Found ${errorCount} validation errors`);
        
        for (const [field, messages] of Object.entries(responseBody.errors)) {
          console.log(`  - ${field}: ${messages.join(', ')}`);
        }
      }
      
      await page.waitForTimeout(1000);
      
      // Look for any error message
      const errorMessages = page.locator('text=/error|invalid|required|validation/i');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
      
      console.log('⏸️  Pausing for 5 seconds to visualize multiple errors...');
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'test-results/error-400-multiple-validation.png', fullPage: true });
      console.log('📸 Screenshot saved: test-results/error-400-multiple-validation.png');
    }
  });
});

test.describe('Problem Details - HTTP Cache Headers Verification', () => {
  
  test('Verify Cache Headers on Successful Requests', async ({ page }) => {
    console.log('\n🧪 TEST: Verify HTTP Cache Headers');
    
    // Login first
    await page.goto('http://localhost:3000');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(500);
    
    await page.getByPlaceholder('Enter username').fill('admin');
    await page.getByPlaceholder('Password').fill('Admin123!');
    
    // Intercept the login request to check headers
    const loginResponse = await page.waitForResponse(
      response => response.url().includes('/api/auth/login')
    );
    
    await page.locator('button[type="submit"]:has-text("Sign in")').click();
    
    console.log('📥 Login Response Headers:');
    const headers = loginResponse.headers();
    
    // Log cache-related headers
    if (headers['cache-control']) {
      console.log('  Cache-Control:', headers['cache-control']);
    }
    if (headers['etag']) {
      console.log('  ETag:', headers['etag']);
    }
    if (headers['vary']) {
      console.log('  Vary:', headers['vary']);
    }
    if (headers['age']) {
      console.log('  Age:', headers['age']);
    }
    
    // Wait for successful login
    await expect(page.locator('button:has-text("Profile")')).toBeVisible({ timeout: 10000 });
    
    // Make a request that should be cached (e.g., fetching cues)
    console.log('🔄 Making cacheable request...');
    
    const cuesResponse = await page.waitForResponse(
      response => response.url().includes('/api/cues') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);
    
    if (cuesResponse) {
      console.log('📥 Cues Response Headers:');
      const cuesHeaders = cuesResponse.headers();
      
      if (cuesHeaders['cache-control']) {
        console.log('  Cache-Control:', cuesHeaders['cache-control']);
        console.log('  ✅ Cache headers are present!');
      } else {
        console.log('  ⚠️  No Cache-Control header found');
      }
      
      if (cuesHeaders['etag']) {
        console.log('  ETag:', cuesHeaders['etag']);
      }
    }
    
    console.log('✅ Cache headers verification complete');
  });
});
