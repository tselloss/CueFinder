/**
 * Playwright E2E Test: Register -> Login -> Add Billiard Table
 *
 * Prerequisites:
 * 1. Backend running at http://localhost:5200
 * 2. Frontend running at http://localhost:3000
 */

const path = require('path');
const { test, expect } = require('@playwright/test');

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';
const APP_BASE_URL = 'http://localhost:3000';

const timestamp = Date.now();
const testUser = {
  username: `tableuser_${timestamp}`,
  password: 'TablePass123!',
  name: 'Table Test User',
  email: `tabletest${timestamp}@example.com`,
  phone: '+15550001111',
  acceptedTerms: true
};

const testTable = {
  title: `E2E Table ${timestamp}`,
  brand: 'Brunswick',
  price: '1200',
  description: 'E2E test listing for a billiard table.',
  location: 'Chicago, IL',
  condition: 'Good'
};

async function registerTestUser(request, userData) {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: userData
  });
  return response.ok();
}

async function getMyTables(request, authToken) {
  const response = await request.get(`${API_BASE_URL}/billiardtables/user/my-tables`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

test.describe('E2E: Register, Login, Add Billiard Table', () => {
  test('Complete flow: register -> login -> add table', async ({ page, request }) => {
    console.log('\n🎱 E2E: Register -> Login -> Add Table\n');

    // ===== STEP 1: Register user via API =====
    console.log('Step 1: Registering test user via API...');
    const registered = await registerTestUser(request, testUser);
    expect(registered).toBeTruthy();
    console.log(`✓ Registered user: ${testUser.username}`);

    // ===== STEP 2: Login via UI =====
    console.log('Step 2: Logging in via UI...');
    await page.goto(`${APP_BASE_URL}/login`);
    await page.waitForURL(/\/login/);
    await page.waitForLoadState('networkidle');

    const usernameByPlaceholder = page.getByPlaceholder('Enter username');
    const usernameByLabel = page.getByLabel(/Username/i);
    const usernameByType = page.locator('input[type="text"]').first();

    if (await usernameByPlaceholder.isVisible().catch(() => false)) {
      await usernameByPlaceholder.fill(testUser.username);
    } else if (await usernameByLabel.isVisible().catch(() => false)) {
      await usernameByLabel.fill(testUser.username);
    } else {
      // Use default timeout from config (now 30s)
      await usernameByType.waitFor({ state: 'visible' });
      await usernameByType.fill(testUser.username);
    }

    const passwordByPlaceholder = page.getByPlaceholder('Enter password');
    const passwordByLabel = page.getByLabel(/Password/i);
    const passwordByType = page.locator('input[type="password"]').first();

    if (await passwordByPlaceholder.isVisible().catch(() => false)) {
      await passwordByPlaceholder.fill(testUser.password);
    } else if (await passwordByLabel.isVisible().catch(() => false)) {
      await passwordByLabel.fill(testUser.password);
    } else {
      // Increased timeout and use the config default
      await passwordByType.waitFor({ state: 'visible' });
      await passwordByType.fill(testUser.password);
    }
    await page.locator('button[type="submit"]').first().click();

    // Wait for login to complete and token to be stored
    await page.waitForFunction(() => localStorage.getItem('authToken'));
    console.log('✓ Logged in and token stored');

    // ===== STEP 3: Navigate to Profile -> My Listings =====
    console.log('Step 3: Navigating to My Listings...');
    await page.goto(`${APP_BASE_URL}/profile`);
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("My Listings")').click();
    await page.waitForTimeout(1000);

    // ===== STEP 4: Open New Listing Modal =====
    console.log('Step 4: Opening listing modal...');
    const addListingButton = page.locator('button:has-text("Add New Listing")').first();
    await addListingButton.click();
    await expect(page.locator('text=Create New Listing')).toBeVisible({ timeout: 10000 });

    // ===== STEP 5: Select Billiard Table =====
    console.log('Step 5: Selecting product type = table...');
    await page.locator('#productType').selectOption('table');
    await page.waitForTimeout(500);

    // ===== STEP 6: Fill Table Details =====
    console.log('Step 6: Filling table details...');
    await page.locator('input[name="title"]').fill(testTable.title);
    await page.locator('input[name="brand"]').fill(testTable.brand);
    await page.locator('input[name="price"]').fill(testTable.price);
    await page.locator('textarea[name="description"]').fill(testTable.description);
    await page.locator('input[name="location"]').fill(testTable.location);

    // Condition (shadcn select)
    await page.locator('#condition').click();
    await page.locator('[role="option"]', { hasText: testTable.condition }).first().click();

    // ===== STEP 7: Upload Image =====
    console.log('Step 7: Uploading image...');
    const imagePath = path.resolve(__dirname, '../../../test-upload.jpg');
    await page.setInputFiles('#image-upload', imagePath);
    await expect(page.locator('text=1 new image(s) selected')).toBeVisible({ timeout: 10000 });

    // ===== STEP 8: Submit Listing =====
    console.log('Step 8: Submitting listing...');
    await page.getByRole('button', { name: /create listing/i }).click();

    // Wait for modal to close
    await expect(page.locator('text=Create New Listing')).toBeHidden({ timeout: 15000 });
    console.log('✓ Listing submitted');

    // ===== STEP 9: Verify via API =====
    console.log('Step 9: Verifying table via API...');
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(authToken).toBeTruthy();

    const myTables = await getMyTables(request, authToken);
    const createdTable = myTables.find(t => t.title === testTable.title);

    expect(createdTable).toBeTruthy();
    expect(createdTable.brand).toBe(testTable.brand);
    console.log(`✓ Table created: ${createdTable.title}`);
  });
});


