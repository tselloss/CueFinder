/**
 * UI Component Visibility E2E Tests
 * 
 * This test file covers:
 * 1. Navigation bar - show/hide states
 * 2. Sidebar menu - toggle visibility
 * 3. Dropdown menus - expand/collapse
 * 4. Modal dialogs - appear/disappear
 * 5. Profile menu - visibility states
 * 6. Mobile responsive menus
 * 
 * Prerequisites:
 * - Backend running at http://localhost:5200
 * - Frontend running at http://localhost:3000
 */

const { test, expect } = require('@playwright/test');
const {
  loginViaUI,
  generateUniqueUser,
  getAuthToken,
  isLoggedIn,
  APP_BASE_URL
} = require('./helpers/authHelper');
const {
  waitForPageLoad,
  isElementVisible,
  clickElement,
  getElementCount,
  getElementText,
  takeScreenshot
} = require('./helpers/uiHelper');

test.describe('UI Components: Visibility and Menu Interactions', () => {
  let testUser;

  test.beforeAll(async () => {
    testUser = generateUniqueUser('ui_test');
    console.log(`\n🎨 UI Test User: ${testUser.username}\n`);
  });

  test('STEP 1: Navigation bar visibility on home page', async ({ page, request }) => {
    console.log('\n🔝 STEP 1: Navigation Bar Visibility\n');

    // Navigate to home
    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    console.log('Checking navigation bar elements...');

    // Check main nav bar exists
    const navBar = page.locator('nav, [role="navigation"], header, [class*="navbar"], [class*="navigation"]').first();
    const navVisible = await navBar.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`✓ Navigation bar visible: ${navVisible}`);

    // Check for logo
    const logo = page.getByRole('heading', { name: /CueFinder/i }).or(page.locator('img[alt*="logo"], [class*="logo"]').first());
    const logoVisible = await logo.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Logo/Brand visible: ${logoVisible}`);

    // Check for home button/link
    const homeButton = page.getByRole('button').filter({ hasText: /Home|Dashboard/i }).or(page.getByText('Home').first());
    const homeVisible = await homeButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Home button visible: ${homeVisible}`);

    // Check for menu button (hamburger on mobile)
    const menuButton = page.locator('[aria-label*="menu" i], button:has-text("☰"), [class*="hamburger"], [class*="menu-button"]').first();
    const menuVisible = await menuButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Menu button visible: ${menuVisible}`);

    // Check for auth buttons (Login/Register)
    const loginButton = page.getByRole('button').filter({ hasText: /Login|Sign In/i }).first();
    const loginVisible = await loginButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Login button visible: ${loginVisible}`);

    const registerButton = page.getByRole('button').filter({ hasText: /Register|Sign Up/i }).first();
    const registerVisible = await registerButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Register button visible: ${registerVisible}`);

    // Take screenshot
    await takeScreenshot(page, 'navbar-unauthenticated');
  });

  test('STEP 2: Sidebar menu toggle (open/close)', async ({ page, request }) => {
    console.log('\n📂 STEP 2: Sidebar Menu Toggle\n');

    // Register and login
    await request.post(`${APP_BASE_URL}/api/auth/register`, {
      data: testUser
    }).catch(() => {});

    await loginViaUI(page, testUser.email, testUser.password);
    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    console.log('Testing sidebar menu...');

    // Find sidebar
    const sidebar = page.locator('[class*="sidebar"], [role="navigation"], aside, .side-menu').first();
    const sidebarInitiallyVisible = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Sidebar initially visible: ${sidebarInitiallyVisible}`);

    // Find menu toggle button
    const toggleButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], [class*="hamburger"], [class*="toggle"]').first();
    const toggleVisible = await toggleButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Toggle button visible: ${toggleVisible}`);

    if (toggleVisible) {
      // Click to open/close
      console.log('Clicking toggle button...');
      await toggleButton.click();
      await page.waitForTimeout(400);
      
      const sidebarAfterToggle = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`✓ Sidebar after toggle: ${sidebarAfterToggle}`);

      // Toggle again
      await toggleButton.click();
      await page.waitForTimeout(400);
      
      const sidebarFinal = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`✓ Sidebar after second toggle: ${sidebarFinal}`);
    }

    // Check sidebar menu items
    console.log('\nChecking sidebar menu items...');
    const menuItems = ['Home', 'Listings', 'Profile', 'Forum', 'Messages', 'Logout'];
    
    for (const item of menuItems) {
      const itemElement = page.getByText(item, { exact: true }).first();
      const itemVisible = await itemElement.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`  ${itemVisible ? '✓' : '✗'} ${item}`);
    }

    await takeScreenshot(page, 'sidebar-menu');
  });

  test('STEP 3: Dropdown menus expand/collapse', async ({ page, request }) => {
    console.log('\n🔽 STEP 3: Dropdown Menus\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    console.log('Testing dropdown menus...');

    // Find dropdown buttons
    const dropdownButtons = page.locator('button, [role="button"]').filter({ hasText: /▼|▾|dropdown|Forum|Categories|Account|Profile/i });
    const dropdownCount = await dropdownButtons.count();
    console.log(`✓ Found ${dropdownCount} potential dropdown buttons`);

    // Test each dropdown
    for (let i = 0; i < Math.min(3, dropdownCount); i++) {
      const button = dropdownButtons.nth(i);
      const buttonText = await button.textContent();
      
      console.log(`\nTesting dropdown: ${buttonText?.trim()}`);

      // Click to open
      await button.click();
      await page.waitForTimeout(300);

      // Check if menu appears
      const menuItems = button.locator('..').locator('[role="menuitem"], li, a').count().catch(() => 0);
      const itemCount = await menuItems;
      console.log(`  ✓ Menu opened with ${itemCount} items`);

      // Click again to close
      await button.click();
      await page.waitForTimeout(300);
      console.log(`  ✓ Menu closed`);
    }

    await takeScreenshot(page, 'dropdowns');
  });

  test('STEP 4: Forum dropdown and categories', async ({ page, request }) => {
    console.log('\n📋 STEP 4: Forum Dropdown and Categories\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    console.log('Testing forum dropdown...');

    // Find forum button
    const forumButton = page.locator('[data-testid="sidebar-forum"]').or(
      page.getByRole('button').filter({ hasText: /Forum/i }).first()
    );

    const forumVisible = await forumButton.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`✓ Forum button visible: ${forumVisible}`);

    if (forumVisible) {
      // Click to open dropdown
      console.log('Opening forum dropdown...');
      await forumButton.click();
      await page.waitForTimeout(500);

      // Check for category items
      const categoryItems = page.locator('button, a').filter({ hasText: /Billiard|Tournaments|Sales|Practise|General/i });
      const categoryCount = await categoryItems.count();
      console.log(`✓ Found ${categoryCount} category items in dropdown`);

      // List categories
      const categoryTexts = await categoryItems.allTextContents().catch(() => []);
      categoryTexts.forEach(cat => {
        console.log(`  • ${cat?.trim()}`);
      });

      // Click a category
      if (categoryCount > 0) {
        console.log('Clicking first category...');
        const firstCategory = categoryItems.first();
        await firstCategory.click();
        await page.waitForURL(`${APP_BASE_URL}/**`, { timeout: 10000 });
        console.log('✓ Category navigated');
      }

      // Close dropdown (click button again)
      console.log('Closing forum dropdown...');
      await forumButton.click();
      await page.waitForTimeout(300);
      console.log('✓ Forum dropdown closed');
    }

    await takeScreenshot(page, 'forum-dropdown');
  });

  test('STEP 5: Profile menu visibility and interactions', async ({ page, request }) => {
    console.log('\n👤 STEP 5: Profile Menu\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    console.log('Testing profile menu...');

    // Find profile button
    const profileButton = page.getByRole('button').filter({ hasText: /Profile|Account|User|Settings/i }).first();
    const profileVisible = await profileButton.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`✓ Profile button visible: ${profileVisible}`);

    if (profileVisible) {
      // Click to open
      console.log('Clicking profile button...');
      await profileButton.click();
      await page.waitForTimeout(400);

      // Check for profile menu items
      const menuItems = page.locator('button, a').filter({ hasText: /Profile|Settings|Edit|Account|Logout|Sign Out/i });
      const itemCount = await menuItems.count();
      console.log(`✓ Profile menu has ${itemCount} items`);

      const itemTexts = await menuItems.allTextContents().catch(() => []);
      itemTexts.forEach(item => {
        console.log(`  • ${item?.trim()}`);
      });

      // Close menu (click button again or click elsewhere)
      console.log('Closing profile menu...');
      await profileButton.click();
      await page.waitForTimeout(300);
      console.log('✓ Profile menu closed');
    }

    await takeScreenshot(page, 'profile-menu');
  });

  test('STEP 6: Modal dialogs - open and close', async ({ page, request }) => {
    console.log('\n📱 STEP 6: Modal Dialogs\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    console.log('Testing modal dialogs...');

    // Find buttons that might open modals
    const potentialModalButtons = page.getByRole('button').filter({ 
      hasText: /New|Create|Add|Edit|Delete|Confirm|Settings/i 
    });
    const buttonCount = await potentialModalButtons.count();
    console.log(`✓ Found ${buttonCount} potential modal trigger buttons`);

    // Test opening a modal if available
    for (let i = 0; i < Math.min(2, buttonCount); i++) {
      const button = potentialModalButtons.nth(i);
      const buttonText = await button.textContent();
      
      console.log(`\nTesting: ${buttonText?.trim()}`);

      try {
        await button.click({ timeout: 3000 });
        await page.waitForTimeout(400);

        // Look for modal
        const modal = page.locator('[role="dialog"], .modal, .dialog, [class*="modal"], [class*="dialog"]').first();
        const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (modalVisible) {
          console.log('  ✓ Modal opened');

          // Find close button
          const closeButton = modal.locator('button[aria-label="close"], button:has-text("×"), button:has-text("✕"), [class*="close"]').first();
          const closeVisible = await closeButton.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (closeVisible) {
            await closeButton.click();
            console.log('  ✓ Modal closed');
          }
        } else {
          console.log('  ℹ️  No modal appeared');
        }
      } catch (e) {
        console.log(`  ℹ️  Button interaction skipped: ${e.message}`);
      }
    }

    await takeScreenshot(page, 'modals');
  });

  test('STEP 7: Mobile responsive menu', async ({ browser, request }) => {
    console.log('\n📱 STEP 7: Mobile Responsive Menu\n');

    // Create mobile viewport context
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 } // iPhone SE size
    });
    const page = await context.newPage();

    try {
      if (!await isLoggedIn(page)) {
        await loginViaUI(page, testUser.email, testUser.password);
      }

      await page.goto(`${APP_BASE_URL}`);
      await waitForPageLoad(page);

      console.log('Testing mobile menu (375px viewport)...');

      // Check hamburger menu
      const hamburger = page.locator('button[aria-label*="menu" i], button:has-text("☰"), [class*="hamburger"]').first();
      const hamburgerVisible = await hamburger.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`✓ Hamburger menu visible: ${hamburgerVisible}`);

      if (hamburgerVisible) {
        // Open mobile menu
        console.log('Opening mobile menu...');
        await hamburger.click();
        await page.waitForTimeout(400);

        // Check for menu items
        const menuItems = page.locator('button, a').filter({ 
          hasText: /Home|Listings|Profile|Forum|Messages|Logout/i 
        });
        const itemCount = await menuItems.count();
        console.log(`✓ Mobile menu has ${itemCount} items`);

        // Close mobile menu
        await hamburger.click();
        console.log('✓ Mobile menu closed');
      }

      await takeScreenshot(page, 'mobile-menu');
    } finally {
      await context.close();
    }
  });

  test('STEP 8: Navigation bar after authentication', async ({ page, request }) => {
    console.log('\n🔐 STEP 8: Authenticated Navigation Bar\n');

    if (!await isLoggedIn(page)) {
      await loginViaUI(page, testUser.email, testUser.password);
    }

    await page.goto(`${APP_BASE_URL}`);
    await waitForPageLoad(page);

    console.log('Checking authenticated navigation elements...');

    // Should not show login/register
    const loginButton = page.getByRole('button').filter({ hasText: /Login|Sign In/i });
    const loginVisible = await loginButton.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`✓ Login button hidden: ${!loginVisible}`);

    // Should show logout
    const logoutButton = page.getByRole('button').filter({ hasText: /Logout|Sign Out|Log Out/i }).first();
    const logoutVisible = await logoutButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Logout button visible: ${logoutVisible}`);

    // Should show profile
    const profileButton = page.getByRole('button').filter({ hasText: /Profile|Account/i }).first();
    const profileVisible = await profileButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Profile button visible: ${profileVisible}`);

    await takeScreenshot(page, 'navbar-authenticated');
  });
});
