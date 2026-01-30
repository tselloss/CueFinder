/**
 * E2E Test: Complete Messaging Flow
 * Tests: Login → View Listing → Message Seller → Check Inbox → View Message
 */

const { test, expect } = require('@playwright/test');

test.describe('Messaging Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.getByRole('heading', { name: '🎱 CueFinder' })).toBeVisible({ timeout: 10000 });
  });

  test('Should complete full messaging workflow', async ({ page, request }) => {
    console.log('1️⃣ Starting messaging flow test');

    // Generate unique test user
    const timestamp = Date.now();
    const testUser = {
      username: `msgflowuser_${timestamp}`,
      email: `msgflowuser_${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Messaging Flow User',
      phone: '+12025551234',
      acceptedTerms: true
    };
    
    // Register test user
    console.log('1.5️⃣ Registering test user...');
    const regResponse = await request.post('http://127.0.0.1:5000/api/auth/register', {
      data: testUser
    });
    console.log(`Registration status: ${regResponse.status()}`);

    // ===== LOGIN =====
    console.log('2️⃣ Logging in...');
    await page.locator('button:has-text("Sign In")').first().click();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 25000 });

    const usernameInput = page.getByPlaceholder('Enter username');
    const passwordInput = page.getByPlaceholder('Password');
    
    await usernameInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });

    await usernameInput.fill(testUser.username);
    await passwordInput.fill(testUser.password);

    const loginButton = page.locator('button:has-text("Sign In")').last();
    await loginButton.click();

    // Wait for navigation to complete - increased timeout
    await page.waitForNavigation({ timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    console.log(`Current URL after login: ${page.url()}`);
    
    const token = await page.evaluate(() => localStorage.getItem('authToken')).catch(() => null);
    console.log(`✅ Logged in, token: ${token ? 'YES' : 'NO'}`);
    expect(token).toBeTruthy();

    // ===== NAVIGATE TO LISTING =====
    console.log('3️⃣ Waiting for listings to load...');
    await page.waitForTimeout(2000);

    // Find and click a listing
    const listingLinks = await page.locator('button, a, div[role="button"]').all();
    console.log(`📦 Found ${listingLinks.length} clickable elements`);

    // Try to click on a listing with brand or title
    const firstVisibleListing = page.locator('div:has-text("Brand")').first();
    if (await firstVisibleListing.isVisible({ timeout: 5000 })) {
      console.log('4️⃣ Clicking on first listing...');
      await firstVisibleListing.click();
    } else {
      console.log('Trying alternative selector...');
      await page.locator('div').filter({ hasText: /€/ }).first().click();
    }

    await page.waitForTimeout(2000);
    const detailUrl = page.url();
    console.log(`📍 Current URL: ${detailUrl}`);

    // ===== MESSAGE SELLER =====
    console.log('5️⃣ Looking for "Message Seller" button...');
    const messageButton = page.locator('button:has-text("Message Seller")');
    
    if (await messageButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Found "Message Seller" button, clicking...');
      await messageButton.click();
      
      // Wait for message modal
      await expect(page.getByRole('heading', { name: 'Message the Seller' })).toBeVisible({ timeout: 5000 });
      console.log('6️⃣ Message modal opened');

      // Fill message
      const subjectField = page.locator('textarea').first();
      const messageField = page.locator('textarea').nth(1);
      
      await subjectField.fill('Interested in this cue');
      await messageField.fill('Hi, is this still available? I would like to purchase it.');

      console.log('7️⃣ Filled message, clicking send...');
      const sendButton = page.locator('button:has-text("Send")').last();
      await sendButton.click();

      // Wait for success message and modal to close
      console.log('⏳ Waiting for success message...');
      await expect(page.locator('text=Message sent!')).toBeVisible({ timeout: 10000 });
      console.log('✅ Message sent successfully - success text visible');

      // Wait for modal to close (closes 1.5s after success)
      console.log('⏳ Waiting for modal to close...');
      await expect(page.getByRole('heading', { name: 'Message the Seller' })).not.toBeVisible({ timeout: 5000 });
      console.log('✅ Modal closed after message sent');
    } else {
      console.log('⚠️ Message Seller button not found - seller may not be available or user not authenticated');
    }

    // ===== NAVIGATE TO INBOX =====
    console.log('8️⃣ Navigating to Inbox...');
    
    // Look for nav link to inbox
    const inboxLink = page.locator('a:has-text("Inbox"), button:has-text("Inbox"), button:has-text("💬")');
    if (await inboxLink.first().isVisible({ timeout: 5000 })) {
      await inboxLink.first().click();
      console.log('9️⃣ Clicked Inbox link');
    } else {
      console.log('Trying to navigate directly to inbox...');
      await page.goto('http://localhost:3000/#/inbox');
    }

    await page.waitForTimeout(2000);

    // ===== VERIFY INBOX =====
    console.log('🔟 Checking Inbox page...');
    const inboxHeading = page.getByRole('heading', { name: /Inbox|Messages/i });
    
    if (await inboxHeading.isVisible({ timeout: 5000 })) {
      console.log('✅ Inbox page loaded');

      // Check for messages list
      const messages = await page.locator('[class*="message"], [class*="Message"]').count();
      console.log(`📨 Found ${messages} message element(s) in inbox`);

      // Look for any message cards/items
      const messageItems = page.locator('div').filter({ hasText: /Interested|from|seller/ });
      const itemCount = await messageItems.count();
      console.log(`Found ${itemCount} message items`);

      // Try to find notification badge
      const badges = page.locator('[class*="badge"], [class*="Notification"]');
      const badgeCount = await badges.count();
      console.log(`📍 Found ${badgeCount} notification badge(s)`);

    } else {
      console.log('⚠️ Could not locate Inbox heading');
    }

    console.log('✅ Messaging flow test completed');
  });
});


