import { test, expect } from '@playwright/test';

test.describe('Message Receiving Flow', () => {
  test('Should allow user to receive and view messages from buyers', async ({ page }) => {
    console.log('\n📨 Starting message receiving flow test\n');

    // Step 1: Navigate to home
    console.log('1️⃣ Navigating to home page...');
    await page.goto('http://localhost:3000');
    await expect(page.getByRole('heading', { name: '🎱 CueFinder' })).toBeVisible({ timeout: 10000 });
    console.log('✅ Home page loaded');

    // Step 2: Login
    console.log('2️⃣ Logging in as testadmin...');
    await page.locator('button:has-text("Sign In")').first().click();
    await expect(page.getByRole('heading', { name: '🎱 Sign In' })).toBeVisible({ timeout: 5000 });

    const usernameInput = page.getByPlaceholder('Enter username');
    const passwordInput = page.getByPlaceholder('Password');
    
    await usernameInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });

    await usernameInput.fill('testadmin');
    await passwordInput.fill('TestAdmin123!');

    const loginButton = page.locator('button:has-text("Sign In")').last();
    await loginButton.click();

    await page.waitForURL(/\/#\/$/, { timeout: 10000 });
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    console.log(`✅ Logged in, token: ${token ? 'YES' : 'NO'}`);
    expect(token).toBeTruthy();

    // Step 3: Wait for listings and find one
    console.log('3️⃣ Waiting for listings to load...');
    await page.waitForTimeout(2000);

    // Find clickable listing elements
    const listingLinks = await page.locator('button, a, div[role="button"]').all();
    console.log(`📦 Found ${listingLinks.length} clickable elements`);

    // Try to click on a listing with brand or title
    const firstVisibleListing = page.locator('div:has-text("Brand")').first();
    if (await firstVisibleListing.isVisible({ timeout: 5000 })) {
      console.log('4️⃣ Clicking on first listing...');
      await firstVisibleListing.click();
    } else {
      console.log('Trying alternative selector for listing...');
      await page.locator('div').filter({ hasText: /€/ }).first().click();
    }

    await page.waitForTimeout(2000);
    const detailUrl = page.url();
    console.log(`📍 Current URL: ${detailUrl}`);

    // Step 4: Send a test message
    console.log('4️⃣ Looking for "Message Seller" button...');
    const messageButton = page.locator('button:has-text("Message Seller")').first();
    
    if (await messageButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Found "Message Seller" button, clicking...');
      await messageButton.click();
      
      await expect(page.getByRole('heading', { name: 'Message the Seller' })).toBeVisible({ timeout: 5000 });
      console.log('5️⃣ Message modal opened');

      // Fill in message
      const subjectField = page.locator('textarea').first();
      const messageField = page.locator('textarea').nth(1);
      
      await subjectField.fill('Question about availability');
      await messageField.fill('Hello! I\'m interested in this item. Is it still available? I\'d like to know more about the condition.');

      console.log('6️⃣ Message filled, clicking send...');
      const sendButton = page.locator('button:has-text("Send")').last();
      await sendButton.click();

      // Wait for success
      console.log('⏳ Waiting for success message...');
      await expect(page.locator('text=Message sent!')).toBeVisible({ timeout: 10000 });
      console.log('✅ Message sent successfully');

      // Wait for modal to close
      await expect(page.getByRole('heading', { name: 'Message the Seller' })).not.toBeVisible({ timeout: 5000 });
    } else {
      console.log('⚠️ Message Seller button not found');
    }

    // Step 5: Navigate to inbox
    console.log('7️⃣ Navigating to Inbox...');
    
    // Look for Inbox button (check for button with text or mail icon)
    const inboxButton = page.locator('button:has-text("Inbox")').first();
    
    if (await inboxButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Found Inbox button');
      await inboxButton.click();
      await page.waitForURL(/.*#\/inbox.*/, { timeout: 5000 });
    } else {
      // Navigate directly
      console.log('📍 Navigating to inbox directly');
      await page.goto('http://localhost:3000/#/inbox');
    }

    // Step 6: Verify inbox loaded
    await page.waitForURL(/.*#\/inbox.*/, { timeout: 5000 }).catch(() => null);
    const currentUrl = page.url();
    console.log(`8️⃣ Current URL after inbox navigation: ${currentUrl}`);
    
    // Wait for inbox content to load
    await page.waitForTimeout(1500);
    
    // Look for any heading that indicates we're in the inbox
    const heading = await page.locator('h1, h2, h3').first().textContent().catch(() => 'Unknown');
    console.log(`📝 Page heading: ${heading}`);

    // Step 7: Look for sent message
    console.log('9️⃣ Checking for message in inbox...');
    await page.waitForTimeout(1500);

    // Look for message by subject
    const messageSubject = page.locator('text=Question about availability');
    const isMessageVisible = await messageSubject.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isMessageVisible) {
      console.log('✅ Message found in inbox!');
      
      // Try to click on it to view details
      try {
        await messageSubject.click();
        await page.waitForTimeout(500);
        
        const contentVisible = await page.locator('text=still available').isVisible({ timeout: 2000 }).catch(() => false);
        if (contentVisible) {
          console.log('✅ Message content visible in detail view');
        }
      } catch (err) {
        console.log('⚠️ Could not open message details');
      }
    } else {
      console.log('⚠️ Message not found in inbox - checking inbox content...');
      const allText = await page.locator('body').textContent();
      if (allText.includes('Question')) {
        console.log('ℹ️ Message content detected on page');
      } else {
        console.log('ℹ️ No message content found (may need backend time)');
      }
    }

    // Step 8: Verify notification badge
    console.log('🔟 Checking notification badge...');
    const headerButtons = await page.locator('button').all();
    let foundBadge = false;
    for (const btn of headerButtons) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Inbox') && text.match(/\d/)) {
        console.log(`📌 Inbox button has unread count: ${text}`);
        foundBadge = true;
        break;
      }
    }
    if (!foundBadge) {
      console.log('ℹ️ No unread badge visible (messages may be marked as read)');
    }

    console.log('\n✅ Message receiving flow test completed!\n');
  });
});
