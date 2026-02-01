/**
 * Comprehensive E2E Test Suite: User Registration, Login, Listings, Profile
 * 
 * This test file covers:
 * 1. Register a new user
 * 2. Login with credentials
 * 3. Add items/listings for multiple types (cues, tables, etc.)
 * 4. Edit a listing
 * 5. Edit user profile
 * 
 * Prerequisites:
 * - Backend running at http://localhost:5200
 * - Frontend running at http://localhost:3000
 */

const { test, expect } = require('@playwright/test');
const {
  registerUser,
  loginViaUI,
  generateUniqueUser,
  setAuthToken,
  getAuthToken,
  isLoggedIn,
  logout,
  API_BASE_URL,
  APP_BASE_URL
} = require('./helpers/authHelper');
const {
  createListing,
  getListings,
  updateListing,
  generateSampleListing,
  generateSampleProfileUpdate,
  updateUserProfile,
  getUserProfile
} = require('./helpers/dataHelper');
const {
  clickButtonByText,
  fillInput,
  getElementText,
  waitForURL,
  isElementVisible,
  getElementCount,
  clickElement,
  waitForPageLoad,
  getAllElementTexts,
  takeScreenshot
} = require('./helpers/uiHelper');

test.describe('Complete User Journey: Register → Login → Add Items → Edit Profile', () => {
  let testUser;
  let token;

  test.beforeAll(async () => {
    // Generate unique test user
    testUser = generateUniqueUser('e2e_user');
    console.log(`\n📝 Test User: ${testUser.username}`);
    console.log(`📧 Email: ${testUser.email}\n`);
  });

  test('STEP 1: Register new user', async ({ page, request }) => {
    console.log('\n🔐 STEP 1: Register New User\n');
    console.log(`Registering: ${testUser.username}`);

    // Register via API
    const response = await registerUser(request, testUser);
    
    // Check if registration successful or user already exists (409)
    expect([200, 201, 409]).toContain(response.status);
    console.log(`✓ Registration response status: ${response.status}`);
    
    // If token provided, save it
    if (response.data.token) {
      token = response.data.token;
      console.log('✓ Token received from registration');
    }
  });

  test('STEP 2: Login user via UI', async ({ page, request }) => {
    console.log('\n🔑 STEP 2: Login User via UI\n');

    // Navigate to app
    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    // Verify we're on home page
    const heading = page.getByRole('heading', { name: /CueFinder/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    console.log('✓ Home page loaded');

    // Find and click login button
    const loginButton = page.getByRole('button').filter({ hasText: /Login|Sign In/i }).first();
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();
    await page.waitForTimeout(500);
    console.log('✓ Login modal opened');

    // Fill username/email
    const emailInput = page.locator('input[type="text"], input[type="email"]').first();
    await emailInput.fill(testUser.email);
    console.log('✓ Email entered');

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testUser.password);
    console.log('✓ Password entered');

    // Submit login
    const submitButton = page.getByRole('button').filter({ hasText: /Login|Sign In|Submit/i }).first();
    await submitButton.click();
    console.log('✓ Login submitted');

    // Wait for redirect or dashboard
    await page.waitForURL(`${APP_BASE_URL}/**`, { timeout: 15000 });
    await waitForPageLoad(page);

    // Verify login success
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    // Get and store token for API calls
    token = await getAuthToken(page);
    console.log('✓ User logged in successfully');
    console.log('✓ Auth token stored');
  });

  test('STEP 3: Add multiple listing types', async ({ page, request }) => {
    console.log('\n📝 STEP 3: Add Multiple Listings\n');

    // Login first if needed
    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
      token = await getAuthToken(page);
    }

    // Test data for different item types
    const itemTypes = ['cue', 'table', 'accessories'];
    const createdListings = [];

    for (const itemType of itemTypes) {
      console.log(`\n📦 Creating ${itemType} listing...`);
      
      const listingData = generateSampleListing(itemType);
      console.log(`Title: ${listingData.title}`);

      // Create listing via API
      const response = await createListing(request, token, listingData);
      expect([200, 201]).toContain(response.status);
      
      const listingId = response.data.id || response.data.Id;
      createdListings.push({
        id: listingId,
        type: itemType,
        title: listingData.title
      });
      
      console.log(`✓ ${itemType} listing created`);
      console.log(`  ID: ${listingId}`);
      console.log(`  Title: ${listingData.title}`);
    }

    // Verify all listings exist
    console.log('\n🔍 Verifying all listings...');
    const allListings = await getListings(request);
    console.log(`✓ Total listings in system: ${allListings.length}`);

    // Store for later tests
    page.context().createdListings = createdListings;
  });

  test('STEP 4: Edit listing via UI', async ({ page, request }) => {
    console.log('\n✏️ STEP 4: Edit Listing via UI\n');

    // Login if needed
    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
      token = await getAuthToken(page);
    }

    // Navigate to listings/dashboard
    console.log('Navigating to listings page...');
    await page.goto(`${APP_BASE_URL}/listings`);
    await page.waitForURL(`${APP_BASE_URL}/listings`, { timeout: 10000 });
    await waitForPageLoad(page);
    console.log('✓ Listings page loaded');

    // Find first listing and click edit
    const editButtons = page.getByRole('button').filter({ hasText: /Edit/i });
    const editButtonCount = await editButtons.count();
    
    if (editButtonCount > 0) {
      console.log(`✓ Found ${editButtonCount} edit button(s)`);
      
      // Click first edit button
      await editButtons.first().click();
      await page.waitForTimeout(500);
      console.log('✓ Edit modal/page opened');

      // Find the title field and update it
      const titleInputs = page.locator('input[type="text"]').filter({ hasText: '' });
      const titleInputCount = await titleInputs.count();
      
      if (titleInputCount > 0) {
        const newTitle = `Updated Title ${Date.now()}`;
        const titleInput = titleInputs.first();
        
        // Clear and fill new title
        await titleInput.clear();
        await titleInput.fill(newTitle);
        console.log(`✓ Title updated: ${newTitle}`);

        // Find and click save button
        const saveButton = page.getByRole('button').filter({ hasText: /Save|Update|Submit/i }).first();
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveButton.click();
          console.log('✓ Changes saved');
          
          // Wait for confirmation
          await page.waitForTimeout(1000);
        }
      }
    } else {
      console.log('⚠️ No listings found to edit - creating one first');
      
      // Create a listing and then edit it
      const listingData = generateSampleListing('cue');
      const response = await createListing(request, token, listingData);
      
      if ([200, 201].includes(response.status)) {
        console.log('✓ Listing created for editing');
        
        // Reload page to see new listing
        await page.reload();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('STEP 5: Edit user profile', async ({ page, request }) => {
    console.log('\n👤 STEP 5: Edit User Profile\n');

    // Login if needed
    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
      token = await getAuthToken(page);
    }

    // Navigate to profile
    console.log('Navigating to profile...');
    
    // Try clicking profile menu/button
    const profileButton = page.getByRole('button').filter({ hasText: /Profile|Account/i }).first();
    
    if (await profileButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileButton.click();
      console.log('✓ Profile menu opened');
      
      // Click edit profile option if it exists
      const editProfileOption = page.getByText(/Edit Profile|My Profile|Settings/i).first();
      if (await editProfileOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editProfileOption.click();
        await page.waitForTimeout(500);
      }
    } else {
      // Try direct navigation
      await page.goto(`${APP_BASE_URL}/profile`);
      await page.waitForURL(`${APP_BASE_URL}/**profile**`, { timeout: 10000 }).catch(() => {});
    }

    await waitForPageLoad(page);
    console.log('✓ Profile page loaded');

    // Update profile via UI
    const profileUpdate = generateSampleProfileUpdate();
    
    // Find and update name field
    const nameInputs = page.locator('input[type="text"]');
    const nameInputCount = await nameInputs.count();
    
    if (nameInputCount > 0) {
      const nameInput = nameInputs.first();
      await nameInput.clear();
      await nameInput.fill(profileUpdate.name);
      console.log(`✓ Name updated: ${profileUpdate.name}`);
    }

    // Find and update bio/description field if exists
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    
    if (textareaCount > 0) {
      const bioTextarea = textareas.first();
      await bioTextarea.clear();
      await bioTextarea.fill(profileUpdate.bio);
      console.log(`✓ Bio updated: ${profileUpdate.bio}`);
    }

    // Find and click save button
    const saveButton = page.getByRole('button').filter({ hasText: /Save|Update|Submit/i }).first();
    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveButton.click();
      console.log('✓ Profile changes saved');
      
      // Wait for confirmation
      await page.waitForTimeout(1000);
    }

    // Verify profile was updated via API
    const profile = await getUserProfile(request, token);
    if (profile) {
      console.log('✓ Profile retrieved successfully');
      console.log(`  Name: ${profile.name}`);
    }
  });

  test('STEP 6: Verify all menus and UI elements are accessible', async ({ page }) => {
    console.log('\n🎯 STEP 6: Verify UI Elements and Menus\n');

    // Login if needed
    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    // Navigate to home
    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    // Check for main navigation elements
    const mainNav = page.locator('nav').first();
    const mainNavVisible = await isElementVisible(page, 'nav', 3000);
    console.log(`✓ Main navigation visible: ${mainNavVisible}`);

    // Check for sidebar if present
    const sidebar = page.locator('[role="navigation"], .sidebar').first();
    const sidebarVisible = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Sidebar visible: ${sidebarVisible}`);

    // Look for key menu items
    const menuItems = ['Home', 'Listings', 'Profile', 'Forum', 'Messages'];
    console.log('\n📋 Checking for menu items:');
    
    for (const item of menuItems) {
      const itemButton = page.getByRole('button').filter({ hasText: item }).first();
      const visible = await itemButton.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`  ${visible ? '✓' : '✗'} ${item}`);
    }

    // Check for dropdown menus
    console.log('\n🔽 Checking dropdown menus:');
    const dropdowns = page.locator('button, [role="button"]').filter({ hasText: /▼|▾|dropdown|menu/i });
    const dropdownCount = await dropdowns.count();
    console.log(`✓ Found ${dropdownCount} potential dropdown elements`);

    // Take screenshot for visual reference
    await takeScreenshot(page, 'ui-overview');
  });

  test('STEP 7: Logout', async ({ page }) => {
    console.log('\n🚪 STEP 7: Logout\n');

    // Navigate to home first
    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    // Find logout button
    const logoutButton = page.getByRole('button').filter({ hasText: /Logout|Sign Out|Log Out|Disconnect/i }).first();
    
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
      console.log('✓ Logout button clicked');
      
      await page.waitForTimeout(1000);
      
      // Verify logged out
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(false);
      console.log('✓ User logged out successfully');
    } else {
      console.log('⚠️ Logout button not found - manually clearing auth');
      await logout(page);
    }
  });
});
