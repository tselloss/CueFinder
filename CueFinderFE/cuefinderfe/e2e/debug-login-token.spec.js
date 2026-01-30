const { test, expect } = require('@playwright/test');

test.describe('Debug Login Token', () => {
  test('Check if login worked and where token is stored', async ({ page, context }) => {
    // Navigate to home
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log('\n=== BEFORE LOGIN ===');
    const buttonsBefore = await page.locator('button').allTextContents();
    console.log('Navbar buttons:', buttonsBefore.slice(0, 5));
    
    // Click Sign In button in navbar
    const navLoginButton = page.locator('button').filter({ hasText: /^Sign In$/i }).first();
    await navLoginButton.click();
    await page.waitForTimeout(1500);
    
    // Fill form with credentials
    await page.locator('input[placeholder="Enter username"]').fill('testuser');
    await page.locator('input[placeholder="Enter password"]').fill('password123');
    
    // Click submit button
    await page.locator('button').filter({ hasText: /Submit|Sign In/i }).last().click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    console.log('\n=== AFTER LOGIN ===');
    const buttonsAfter = await page.locator('button').allTextContents();
    console.log('Navbar buttons:', buttonsAfter.slice(0, 8));
    
    // Check for logged-in user elements
    const userMenuText = await page.locator('button').filter({ hasText: /Profile|Account|User|testuser/i }).textContent().catch(() => null);
    console.log('Found user menu:', userMenuText ? 'YES' : 'NO');
    
    // Check cookies
    const cookies = await context.cookies();
    console.log(`\n=== COOKIES (${cookies.length}) ===`);
    cookies.forEach(cookie => {
      console.log(`  ${cookie.name}: ${cookie.value.substring(0, 50)}`);
    });
    
    // Check localStorage
    const localStorage = await page.evaluate(() => Object.fromEntries(Object.entries(window.localStorage)));
    console.log(`\n=== LOCAL STORAGE (${Object.keys(localStorage).length} keys) ===`);
    Object.entries(localStorage).forEach(([k, v]) => {
      console.log(`  ${k}: ${v.substring(0, 50)}`);
    });
    
    // Check sessionStorage
    const sessionStorage = await page.evaluate(() => Object.fromEntries(Object.entries(window.sessionStorage)));
    console.log(`\n=== SESSION STORAGE (${Object.keys(sessionStorage).length} keys) ===`);
    Object.entries(sessionStorage).forEach(([k, v]) => {
      console.log(`  ${k}: ${v.substring(0, 50)}`);
    });
    
    // Check the actual HTTP response headers
    page.on('response', response => {
      if (response.url().includes('login') && response.status() < 300) {
        console.log(`\nLogin response: ${response.status()}`);
      }
    });
  });
});
