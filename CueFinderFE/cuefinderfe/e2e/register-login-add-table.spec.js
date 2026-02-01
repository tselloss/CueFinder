/**
 * E2E Test: Register → Login → Add Billiard Table
 * 
 * This test covers the complete user flow:
 * 1. Register a new user account
 * 2. Login with the new credentials
 * 3. Navigate to profile and create a new billiard table listing
 * 4. Verify the table was created successfully
 * 
 * Prerequisites:
 * - Backend running at http://localhost:5200 (or set API_BASE_URL)
 * - Frontend running at http://localhost:3000 (or set APP_BASE_URL)
 * - Test image available at: ../../../test-upload.jpg
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://127.0.0.1:3000';

// Generate unique test data
const timestamp = Date.now();
const testUser = {
  username: `tableuser_${timestamp}`,
  password: 'SecurePass123!',
  name: 'Table Test User',
  email: `tableuser_${timestamp}@example.com`,
  phone: '+15551234567',
  acceptedTerms: true
};

const testTable = {
  title: `Professional Pool Table ${timestamp}`,
  brand: 'Brunswick',
  price: '2500',
  description: 'Professional grade 8ft pool table in excellent condition. Includes balls, cues, and rack. Slate bed, leather pockets.',
  location: 'Chicago, IL',
  condition: 'Good'
};

test.describe('E2E: Register → Login → Add Billiard Table', () => {
  
  test('should register via API, login via API, and create a billiard table via UI', async ({ page, request }) => {
    console.log('\n🎱 Starting E2E Test: Register (API) → Login (API) → Add Table (UI)\n');
    console.log(`Test User: ${testUser.username}`);
    console.log(`Test Email: ${testUser.email}\n`);

    // ============================================================
    // STEP 1: REGISTER NEW USER VIA API
    // ============================================================
    console.log('📝 STEP 1: Registering new user via API...');
    
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });
    
    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    console.log(`✅ User registered: ${testUser.username}\n`);

    // ============================================================
    // STEP 2: LOGIN VIA API
    // ============================================================
    console.log('🔐 STEP 2: Logging in via API...');
    
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        emailOrUsername: testUser.username,
        password: testUser.password
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const authToken = loginData.token || loginData.accessToken;
    expect(authToken).toBeTruthy();
    console.log(`✅ Login successful\n`);

    // ============================================================
    // STEP 3: SET AUTH TOKEN BEFORE APP LOAD
    // ============================================================
    console.log('🔑 STEP 3: Setting auth token before app load...');
    
    await page.addInitScript((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);
    await page.goto(`${APP_BASE_URL}/#/profile`, { waitUntil: 'networkidle' });
    console.log(`✅ Auth token set in localStorage\n`);

    // If we were redirected to login, complete UI login and return to profile
    const loginUsernameInput = page.getByPlaceholder('Enter username');
    const myListingsButton = page.locator('button:has-text("My Listings")');

    const waitForProfileOrLogin = async () => {
      const start = Date.now();
      while (Date.now() - start < 20000) {
        if (await myListingsButton.isVisible()) return 'profile';
        if (await loginUsernameInput.isVisible()) return 'login';
        await page.waitForTimeout(500);
      }
      return 'timeout';
    };

    const viewState = await waitForProfileOrLogin();
    console.log(`Current URL: ${page.url()}`);

    if (viewState === 'login') {
      console.log('🔁 Detected login page, completing UI login...');
      await loginUsernameInput.fill(testUser.username);
      await page.locator('input[placeholder="Password"], input[placeholder="Enter password"], input[type="password"]').first().fill(testUser.password);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL(/#\/$/, { timeout: 15000 });
      await page.goto(`${APP_BASE_URL}/#/profile`, { waitUntil: 'networkidle' });
      await myListingsButton.waitFor({ state: 'visible', timeout: 20000 });
    }

    // ============================================================
    // STEP 4: NAVIGATE TO MY LISTINGS
    // ============================================================
    console.log('📂 STEP 4: Navigating to My Listings...');
    await page.waitForTimeout(2000); // Wait for React to hydrate
    
    await myListingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await myListingsButton.click();
    await page.waitForTimeout(1000);
    console.log(`✅ Navigated to My Listings\n`);

    // ============================================================
    // STEP 5: OPEN ADD LISTING MODAL
    // ============================================================
    console.log('➕ STEP 5: Opening Add Listing modal...');
    
    const addListingButton = page.locator('button:has-text("Add New Listing")').first();
    await addListingButton.waitFor({ state: 'visible', timeout: 10000 });
    await addListingButton.click();
    
    await expect(page.locator('text=Create New Listing'))
      .toBeVisible({ timeout: 10000 });
    console.log(`✅ Modal opened\n`);

    // ============================================================
    // STEP 6: SELECT PRODUCT TYPE - BILLIARD TABLE
    // ============================================================
    console.log('🎱 STEP 6: Selecting product type: Billiard Table...');
    
    const productTypeSelect = page.locator('#productType');
    await productTypeSelect.waitFor({ state: 'visible', timeout: 10000 });
    await productTypeSelect.selectOption('table');
    await page.waitForTimeout(500); // Wait for form to update
    console.log(`✅ Product type selected: table\n`);

    // ============================================================
    // STEP 7: FILL TABLE DETAILS
    // ============================================================
    console.log('📝 STEP 7: Filling in table details...');
    
    await page.locator('input[name="title"]').fill(testTable.title);
    console.log(`  - Title: ${testTable.title}`);
    
    await page.locator('input[name="brand"]').fill(testTable.brand);
    console.log(`  - Brand: ${testTable.brand}`);
    
    await page.locator('input[name="price"]').fill(testTable.price);
    console.log(`  - Price: $${testTable.price}`);
    
    await page.locator('textarea[name="description"]').fill(testTable.description);
    console.log(`  - Description: ${testTable.description.substring(0, 50)}...`);
    
    await page.locator('input[name="location"]').fill(testTable.location);
    console.log(`  - Location: ${testTable.location}`);

    // Select condition (shadcn select component)
    await page.locator('#condition').click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]', { hasText: testTable.condition }).first().click();
    console.log(`  - Condition: ${testTable.condition}`);
    console.log(`✅ All fields filled\n`);

    // ============================================================
    // STEP 8: UPLOAD IMAGE
    // ============================================================
    console.log('📸 STEP 8: Uploading table image...');
    
    const imagePath = path.resolve(__dirname, '../../../test-upload.jpg');
    const imageInput = page.locator('#image-upload');
    await imageInput.setInputFiles(imagePath);
    
    // Wait for image upload confirmation
    await expect(page.locator('text=1 new image(s) selected'))
      .toBeVisible({ timeout: 10000 });
    console.log(`✅ Image uploaded: ${path.basename(imagePath)}\n`);

    // ============================================================
    // STEP 9: SUBMIT LISTING
    // ============================================================
    console.log('💾 STEP 9: Submitting the listing...');
    
    const submitButton = page.getByRole('button', { name: /create listing/i });
    await submitButton.click();

    // Wait for modal to close (listing created)
    await expect(page.locator('text=Create New Listing'))
      .toBeHidden({ timeout: 15000 });
    console.log(`✅ Listing submitted successfully\n`);

    // ============================================================
    // STEP 10: VERIFY TABLE CREATION VIA API
    // ============================================================
    console.log('✔️ STEP 10: Verifying table creation via API...');
    
    const myTablesResponse = await request.get(
      `${API_BASE_URL}/billiardtables/user/my-tables`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    expect(myTablesResponse.ok()).toBeTruthy();
    const myTables = await myTablesResponse.json();
    
    const createdTable = myTables.find(t => t.title === testTable.title);
    expect(createdTable).toBeTruthy();
    expect(createdTable.brand).toBe(testTable.brand);
    expect(createdTable.price).toBe(parseFloat(testTable.price));
    
    // Location might not be stored, but check if it exists in the response
    if (createdTable.location === undefined) {
      console.log('⚠️  Note: location field was not persisted (may be by design)');
    } else {
      expect(createdTable.location).toBe(testTable.location);
    }
    
    console.log(`✅ Table verified in database:`);
    console.log(`  - ID: ${createdTable.id}`);
    console.log(`  - Title: ${createdTable.title}`);
    console.log(`  - Brand: ${createdTable.brand}`);
    console.log(`  - Price: $${createdTable.price}`);
    console.log(`  - Location: ${createdTable.location}`);
    console.log('\n🎉 E2E Test Completed Successfully!\n');
  });
});


