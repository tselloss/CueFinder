const { test } = require('@playwright/test');

test.describe('Debug Login Flow', () => {
  test('Check login form and try login', async ({ page }) => {
    console.log('\n=== LOGIN DEBUG ===\n');
    
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Go to home
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`\nURL: ${page.url()}`);
    
    // Click Sign In button using getByRole
    console.log('\nClicking Sign In button...');
    const signInButton = page.getByRole('button', { name: /Sign In/i }).first();
    await signInButton.click();
    await page.waitForTimeout(2000);
    
    console.log(`After click URL: ${page.url()}`);
    
    // Check for form fields
    const emailInputs = await page.locator('input[type="email"], input[type="text"]').all();
    const passwordInputs = await page.locator('input[type="password"]').all();
    
    console.log(`\nForm fields found:`);
    console.log(`  Email inputs: ${emailInputs.length}`);
    console.log(`  Password inputs: ${passwordInputs.length}`);
    
    if (emailInputs.length > 0 && passwordInputs.length > 0) {
      console.log('\n=== Attempting Login ===');
      console.log('Email: testuser@example.com');
      console.log('Password: password123');
      
      // Fill form
      await emailInputs[0].fill('testuser@example.com');
      console.log('✓ Filled email');
      
      await passwordInputs[0].fill('password123');
      console.log('✓ Filled password');
      
      // Find submit button
      const submitButton = page.getByRole('button', { name: /Sign In|Submit/i }).last();
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      console.log(`\nAfter submit URL: ${page.url()}`);
      
      // Check cookies
      const cookies = await page.context().cookies();
      console.log(`\nCookies found: ${cookies.length}`);
      cookies.forEach(c => {
        if (c.name.toLowerCase().includes('token') || c.name.toLowerCase().includes('auth')) {
          console.log(`  ✓ ${c.name}: ${c.value.substring(0, 30)}...`);
        }
      });
      
      // Check if logged in (Sign In button should be gone)
      const signInVisible = await page.locator('button').filter({ hasText: /Sign In/i }).first().isVisible().catch(() => false);
      console.log(`\nSign In button visible after login: ${signInVisible}`);
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/login-result.png', fullPage: true });
      console.log('Screenshot saved: login-result.png');
    } else {
      console.log('ERROR: Login form fields not found!');
      await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
    }
  });
});
