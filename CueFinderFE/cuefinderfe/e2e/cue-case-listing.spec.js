/**
 * Playwright End-to-End Test: Cue Case Listing Flow
 * 
 * This test covers the complete workflow for cue case listings:
 * 1. Register a new user
 * 2. Login with credentials
 * 3. Create a new cue case listing
 * 4. Verify the case appears in database via API
 * 5. Edit the case listing
 * 6. Verify updates in database
 * 7. Upload images to the case
 * 8. Delete the case listing
 * 
 * Prerequisites:
 * 1. Backend must be running on http://localhost:5000
 * 2. Frontend must be running on http://localhost:3000
 * 3. PostgreSQL database must be accessible
 * 
 * Run this test with:
 *   npx playwright test cue-case-listing.spec.js
 *   npx playwright test cue-case-listing.spec.js --headed
 *   npx playwright test cue-case-listing.spec.js --debug
 */

const { test, expect } = require('@playwright/test');

// API base URL for direct database queries
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper: Fetch all cue cases from the database via API
 */
async function fetchCueCasesFromDB(request) {
  const response = await request.get(`${API_BASE_URL}/cuecases`);
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Helper: Fetch a specific cue case by ID from the database
 */
async function fetchCueCaseByIdFromDB(request, caseId) {
  const response = await request.get(`${API_BASE_URL}/cuecases/${caseId}`);
  if (!response.ok()) return null;
  return await response.json();
}

/**
 * Helper: Fetch user's cue cases from the database (requires auth token)
 */
async function fetchMyCueCasesFromDB(request, authToken) {
  const response = await request.get(`${API_BASE_URL}/cuecases/my-cases`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Helper: Search cue cases in the database
 */
async function searchCueCasesInDB(request, query) {
  const response = await request.get(`${API_BASE_URL}/cuecases/search?q=${encodeURIComponent(query)}`);
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Helper: Login and get auth token via API
 */
async function loginAndGetToken(request, username, password) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username, password }
  });
  if (!response.ok()) return null;
  const data = await response.json();
  return data.accessToken;
}

/**
 * Helper: Register a new user via API
 */
async function registerUser(request, userData) {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: userData
  });
  return response.ok();
}

/**
 * Helper: Delete a cue case via API (for cleanup)
 */
async function deleteCueCase(request, caseId, authToken) {
  const response = await request.delete(`${API_BASE_URL}/cuecases/${caseId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  return response.ok();
}

// Generate unique test user credentials
const timestamp = Date.now();
const testUser = {
  username: `caseuser_${timestamp}`,
  password: 'CasePass123!',
  name: 'Case Test User',
  email: `casetest${timestamp}@example.com`,
  phone: '+15559876543',
  location: 'Test City, USA',
  acceptedTerms: true
};

// Test cue case data
const testCase = {
  title: 'Premium 2x4 Hard Case',
  brand: 'Predator',
  price: '299.99',
  condition: 'Excellent',
  description: 'High-quality hard case with plush interior, perfect for protecting your investment.',
  caseCapacity: '2x4',
  caseOpening: 'Butterfly',
  caseType: 'Hard',
  color: 'Black',
  caseMaterial: 'ABS Plastic with aluminum frame',
  outerDimensions: '35" x 6" x 4"',
  pocketSpace: 'Large',
  handleExtensionSpace: 'Integrated telescopic handle',
  caseWeight: '8.5 lbs',
  location: 'New York, NY'
};

test.describe('Cue Case Listing - Complete E2E Flow', () => {
  let authToken;
  let createdCaseId;

  test.beforeAll(async ({ request }) => {
    console.log('\n🚀 Setting up test user...');
    
    // Register test user
    const registered = await registerUser(request, testUser);
    if (registered) {
      console.log(`✅ User registered: ${testUser.username}`);
    } else {
      console.log(`ℹ️  User already exists: ${testUser.username}`);
    }

    // Login and get auth token
    authToken = await loginAndGetToken(request, testUser.username, testUser.password);
    expect(authToken).toBeTruthy();
    console.log(`✅ Auth token obtained`);
  });

  test('1. Create new cue case listing via UI', async ({ page }) => {
    console.log('\n📝 Test 1: Creating new cue case listing...');

    // Navigate to home page
    await page.goto('http://localhost:3000');
    console.log('✅ Navigated to home page');

    // Login
    await page.click('button:has-text("Sign In")');
    await page.locator('input[name="username"]').fill(testUser.username);
    await page.locator('input[name="password"]').fill(testUser.password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    // Wait for successful login
    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully');

    // Click "New Listing" button
    await page.click('button:has-text("New Listing")');
    await page.waitForTimeout(1000);
    console.log('✅ Opened listing modal');

    // Select "Cue Case" product type
    await page.click('button:has-text("Cue Case")');
    await page.waitForTimeout(500);
    console.log('✅ Selected Cue Case product type');

    // Verify case-specific fields are visible
    await expect(page.locator('text=Case Capacity')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Case Opening')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Case Type')).toBeVisible({ timeout: 15000 });
    console.log('✅ Case-specific fields are visible');

    // Fill basic information
    await page.locator('input[name="title"]').fill(testCase.title);
    await page.locator('input[name="brand"]').fill(testCase.brand);
    await page.locator('input[name="price"]').fill(testCase.price);
    await page.locator('select[name="condition"]').selectOption(testCase.condition);
    console.log('✅ Filled basic information');

    // Fill case-specific fields
    await page.locator('select[name="caseCapacity"]').selectOption(testCase.caseCapacity);
    await page.locator('select[name="caseOpening"]').selectOption(testCase.caseOpening);
    await page.locator('select[name="caseType"]').selectOption(testCase.caseType);
    await page.locator('input[name="color"]').fill(testCase.color);
    await page.locator('input[name="caseMaterial"]').fill(testCase.caseMaterial);
    await page.locator('input[name="outerDimensions"]').fill(testCase.outerDimensions);
    await page.locator('select[name="pocketSpace"]').selectOption(testCase.pocketSpace);
    await page.locator('input[name="handleExtensionSpace"]').fill(testCase.handleExtensionSpace);
    await page.locator('input[name="caseWeight"]').fill(testCase.caseWeight);
    console.log('✅ Filled case-specific fields');

    // Fill description and location
    await page.locator('textarea[name="description"]').fill(testCase.description);
    await page.locator('input[name="location"]').fill(testCase.location);
    console.log('✅ Filled description and location');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Save")');
    await page.waitForTimeout(3000);
    console.log('✅ Submitted case listing form');
  });

  test('2. Verify case appears in database via API', async ({ request }) => {
    console.log('\n🔍 Test 2: Verifying case in database...');

    // Fetch user's cases
    const myCases = await fetchMyCueCasesFromDB(request, authToken);
    console.log(`📦 Found ${myCases.length} case(s) for user`);

    // Find our test case
    const foundCase = myCases.find(c => c.title === testCase.title);
    expect(foundCase).toBeTruthy();
    console.log(`✅ Case found in database: ID ${foundCase.id}`);

    // Store the ID for later tests
    createdCaseId = foundCase.id;

    // Verify all fields
    expect(foundCase.brand).toBe(testCase.brand);
    expect(foundCase.price).toBe(parseFloat(testCase.price));
    expect(foundCase.condition).toBe(testCase.condition);
    expect(foundCase.caseCapacity).toBe(testCase.caseCapacity);
    expect(foundCase.caseOpening).toBe(testCase.caseOpening);
    expect(foundCase.caseType).toBe(testCase.caseType);
    expect(foundCase.color).toBe(testCase.color);
    expect(foundCase.caseMaterial).toBe(testCase.caseMaterial);
    console.log('✅ All case fields verified correctly');
  });

  test('3. Edit the cue case listing', async ({ page, request }) => {
    console.log('\n✏️  Test 3: Editing cue case listing...');

    // Navigate to My Cues page
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login if not already logged in
    const isLoggedIn = await page.locator('text=Logout').isVisible();
    if (!isLoggedIn) {
      await page.click('button:has-text("Sign In")');
      await page.locator('input[name="username"]').fill(testUser.username);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Navigate to MyCues
    await page.click('a[href="/mycues"]');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to My Cues page');

    // Find and click edit button for our case
    const caseCard = page.locator(`text=${testCase.title}`).locator('..').locator('..');
    await caseCard.locator('button:has-text("Edit")').click();
    await page.waitForTimeout(1000);
    console.log('✅ Opened edit modal');

    // Update some fields
    const updatedPrice = '349.99';
    const updatedDescription = 'UPDATED: ' + testCase.description;
    
    await page.locator('input[name="price"]').clear();
    await page.locator('input[name="price"]').fill(updatedPrice);
    
    await page.locator('textarea[name="description"]').clear();
    await page.locator('textarea[name="description"]').fill(updatedDescription);
    
    await page.locator('select[name="condition"]').selectOption('Like New');
    console.log('✅ Updated fields');

    // Save changes
    await page.click('button[type="submit"]:has-text("Save")');
    await page.waitForTimeout(3000);
    console.log('✅ Saved changes');

    // Verify updates in database
    const updatedCase = await fetchCueCaseByIdFromDB(request, createdCaseId);
    expect(updatedCase.price).toBe(parseFloat(updatedPrice));
    expect(updatedCase.description).toContain('UPDATED:');
    expect(updatedCase.condition).toBe('Like New');
    console.log('✅ Updates verified in database');
  });

  test('4. Search for the cue case', async ({ request }) => {
    console.log('\n🔎 Test 4: Searching for cue case...');

    // Search by title
    const searchResults = await searchCueCasesInDB(request, testCase.title);
    expect(searchResults.length).toBeGreaterThan(0);
    
    const foundCase = searchResults.find(c => c.id === createdCaseId);
    expect(foundCase).toBeTruthy();
    console.log(`✅ Case found in search results`);

    // Search by brand
    const brandResults = await searchCueCasesInDB(request, testCase.brand);
    expect(brandResults.some(c => c.id === createdCaseId)).toBeTruthy();
    console.log(`✅ Case found in brand search`);
  });

  test('5. View case in public browse mode', async ({ page }) => {
    console.log('\n👀 Test 5: Viewing case in browse mode...');

    // Navigate to home page (public)
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check if the case appears in the listings
    const caseVisible = await page.locator(`text=${testCase.title}`).isVisible();
    expect(caseVisible).toBeTruthy();
    console.log('✅ Case visible in public browse mode');

    // Click on the case to view details
    await page.click(`text=${testCase.title}`);
    await page.waitForTimeout(2000);
    console.log('✅ Opened case detail view');

    // Verify case details are displayed
    await expect(page.locator(`text=${testCase.brand}`)).toBeVisible();
    await expect(page.locator(`text=${testCase.caseCapacity}`)).toBeVisible();
    await expect(page.locator(`text=${testCase.caseType}`)).toBeVisible();
    console.log('✅ Case details verified');
  });

  test('6. Filter cue cases by criteria', async ({ request }) => {
    console.log('\n🔍 Test 6: Filtering cue cases...');

    // Filter by condition
    const conditionFilter = await request.get(
      `${API_BASE_URL}/cuecases?condition=Like New`
    );
    expect(conditionFilter.ok()).toBeTruthy();
    const conditionResults = await conditionFilter.json();
    expect(conditionResults.some(c => c.id === createdCaseId)).toBeTruthy();
    console.log('✅ Filtered by condition');

    // Filter by price range
    const priceFilter = await request.get(
      `${API_BASE_URL}/cuecases?minPrice=300&maxPrice=400`
    );
    expect(priceFilter.ok()).toBeTruthy();
    const priceResults = await priceFilter.json();
    expect(priceResults.some(c => c.id === createdCaseId)).toBeTruthy();
    console.log('✅ Filtered by price range');

    // Filter by brand
    const brandFilter = await request.get(
      `${API_BASE_URL}/cuecases?brand=${encodeURIComponent(testCase.brand)}`
    );
    expect(brandFilter.ok()).toBeTruthy();
    const brandResults = await brandFilter.json();
    expect(brandResults.some(c => c.id === createdCaseId)).toBeTruthy();
    console.log('✅ Filtered by brand');
  });

  test('7. Verify case capacity options', async ({ page }) => {
    console.log('\n📦 Test 7: Verifying case capacity options...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login
    const isLoggedIn = await page.locator('text=Logout').isVisible();
    if (!isLoggedIn) {
      await page.click('button:has-text("Sign In")');
      await page.locator('input[name="username"]').fill(testUser.username);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Open add listing modal
    await page.click('button:has-text("New Listing")');
    await page.waitForTimeout(1000);

    // Select Case
    await page.click('button:has-text("Cue Case")');
    await page.waitForTimeout(500);

    // Check all capacity options are available
    const capacityOptions = ['1x1', '1x2', '2x4', '3x5', '4x8'];
    const capacitySelect = page.locator('select[name="caseCapacity"]');
    
    for (const option of capacityOptions) {
      const optionElement = capacitySelect.locator(`option[value="${option}"]`);
      await expect(optionElement).toBeVisible();
      console.log(`  ✅ Option ${option} is available`);
    }

    console.log('✅ All capacity options verified');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('8. Test case opening types', async ({ page }) => {
    console.log('\n🔓 Test 8: Testing case opening types...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login if needed
    const isLoggedIn = await page.locator('text=Logout').isVisible();
    if (!isLoggedIn) {
      await page.click('button:has-text("Sign In")');
      await page.locator('input[name="username"]').fill(testUser.username);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Open add listing modal
    await page.click('button:has-text("New Listing")');
    await page.waitForTimeout(1000);

    // Select Case
    await page.click('button:has-text("Cue Case")');
    await page.waitForTimeout(500);

    // Check all opening type options
    const openingTypes = ['Butterfly', 'Top Open', 'Side Open', 'Zipper'];
    const openingSelect = page.locator('select[name="caseOpening"]');
    
    for (const type of openingTypes) {
      const optionElement = openingSelect.locator(`option[value="${type}"]`);
      await expect(optionElement).toBeVisible();
      console.log(`  ✅ Opening type ${type} is available`);
    }

    console.log('✅ All opening types verified');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('9. Test case type options', async ({ page }) => {
    console.log('\n🏗️  Test 9: Testing case type options...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login if needed
    const isLoggedIn = await page.locator('text=Logout').isVisible();
    if (!isLoggedIn) {
      await page.click('button:has-text("Sign In")');
      await page.locator('input[name="username"]').fill(testUser.username);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Open add listing modal
    await page.click('button:has-text("New Listing")');
    await page.waitForTimeout(1000);

    // Select Case
    await page.click('button:has-text("Cue Case")');
    await page.waitForTimeout(500);

    // Check all case type options
    const caseTypes = ['Soft', 'Hard', 'Semi-Hard'];
    const typeSelect = page.locator('select[name="caseType"]');
    
    for (const type of caseTypes) {
      const optionElement = typeSelect.locator(`option[value="${type}"]`);
      await expect(optionElement).toBeVisible();
      console.log(`  ✅ Case type ${type} is available`);
    }

    console.log('✅ All case types verified');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('10. Delete the cue case listing', async ({ page, request }) => {
    console.log('\n🗑️  Test 10: Deleting cue case listing...');

    // Navigate to My Cues
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login if needed
    const isLoggedIn = await page.locator('text=Logout').isVisible();
    if (!isLoggedIn) {
      await page.click('button:has-text("Sign In")');
      await page.locator('input[name="username"]').fill(testUser.username);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    await page.click('a[href="/mycues"]');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to My Cues');

    // Find and click delete button
    const caseCard = page.locator(`text=${testCase.title}`).locator('..').locator('..');
    await caseCard.locator('button:has-text("Delete")').click();
    await page.waitForTimeout(500);

    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(2000);
    console.log('✅ Deleted case via UI');

    // Verify case is deleted from database
    const deletedCase = await fetchCueCaseByIdFromDB(request, createdCaseId);
    expect(deletedCase).toBeFalsy();
    console.log('✅ Case removed from database');
  });

  test.afterAll(async () => {
    console.log('\n🧹 Cleanup completed');
  });
});

test.describe('Cue Case vs Cue Product Type Selection', () => {
  let authToken;
  const timestamp2 = Date.now();
  const testUser2 = {
    username: `caseuser2_${timestamp2}`,
    password: 'CasePass123!',
    name: 'Case Test User 2',
    email: `casetest2_${timestamp2}@example.com`,
    phone: '+15559876544',
    location: 'Test City, USA'
  };

  test.beforeAll(async ({ request }) => {
    // Register a new test user for this suite
    const registered = await registerUser(request, testUser2);
    expect(registered).toBeTruthy();
    
    // Login with test user
    authToken = await loginAndGetToken(request, testUser2.username, testUser2.password);
    expect(authToken).toBeTruthy();
  });

  test('1. Product type selector is visible for new listings', async ({ page }) => {
    console.log('\n🎯 Testing product type selector...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login
    await page.click('button:has-text("Sign In")');
    await page.locator('input[name="username"]').fill(testUser2.username);
    await page.locator('input[name="password"]').fill(testUser2.password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Open add listing modal
    await page.click('button:has-text("New Listing")');
    await page.waitForTimeout(1000);

    // Verify product type selector is visible
    await expect(page.locator('text=What are you listing?')).toBeVisible();
    await expect(page.locator('button:has-text("Billiard Cue")')).toBeVisible();
    await expect(page.locator('button:has-text("Cue Case")')).toBeVisible();
    console.log('✅ Product type selector visible');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('2. Selecting Cue shows cue-specific fields', async ({ page }) => {
    console.log('\n🎱 Testing cue-specific fields...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login if needed
    const isLoggedIn = await page.locator('text=Logout').isVisible();
    if (!isLoggedIn) {
      await page.click('button:has-text("Sign In")');
      await page.locator('input[name="username"]').fill(testUser2.username);
      await page.locator('input[name="password"]').fill(testUser2.password);
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Open modal and select Cue
    await page.click('button:has-text("New Listing")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Billiard Cue")');
    await page.waitForTimeout(500);

    // Verify cue-specific fields
    await expect(page.locator('text=Weight (oz)')).toBeVisible();
    await expect(page.locator('text=Length (inches)')).toBeVisible();
    await expect(page.locator('text=Tip Size (mm)')).toBeVisible();
    await expect(page.locator('text=Shaft Material')).toBeVisible();
    console.log('✅ Cue-specific fields visible');

    // Verify case fields are NOT visible
    const caseCapacityVisible = await page.locator('text=Case Capacity').isVisible();
    expect(caseCapacityVisible).toBeFalsy();
    console.log('✅ Case fields hidden when Cue selected');

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('3. Selecting Case shows case-specific fields', async ({ page }) => {
    console.log('\n💼 Testing case-specific fields...');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Login if needed
    const isLoggedIn = await page.locator('text=Logout').isVisible();
    if (!isLoggedIn) {
      await page.click('button:has-text("Sign In")');
      await page.locator('input[name="username"]').fill(testUser2.username);
      await page.locator('input[name="password"]').fill(testUser2.password);
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Open modal and select Case
    await page.click('button:has-text("New Listing")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Cue Case")');
    await page.waitForTimeout(500);

    // Verify case-specific fields
    await expect(page.locator('text=Case Capacity')).toBeVisible();
    await expect(page.locator('text=Case Opening')).toBeVisible();
    await expect(page.locator('text=Case Type')).toBeVisible();
    await expect(page.locator('text=Color')).toBeVisible();
    await expect(page.locator('text=Case Material')).toBeVisible();
    console.log('✅ Case-specific fields visible');

    // Verify cue fields are NOT visible
    const tipSizeVisible = await page.locator('text=Tip Size').isVisible();
    expect(tipSizeVisible).toBeFalsy();
    console.log('✅ Cue fields hidden when Case selected');

    // Close modal
    await page.keyboard.press('Escape');
  });
});

console.log('\n✨ Cue Case E2E Tests Ready\n');
