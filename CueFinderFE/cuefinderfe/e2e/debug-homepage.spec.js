const { test, expect } = require('@playwright/test');

test('Debug: Check what renders on homepage', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('domcontentloaded');
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if React root exists
  const rootExists = await page.locator('#root').count();
  console.log('React root exists:', rootExists > 0);
  
  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log(`Total buttons found: ${buttons.length}`);
  
  // Get button texts
  for (let i = 0; i < Math.min(10, buttons.length); i++) {
    const text = await buttons[i].textContent();
    console.log(`Button ${i}: ${text?.trim()}`);
  }
  
  // Check for Card components
  const cards = await page.locator('[data-testid="cue-card"]').count();
  console.log(`Cards found: ${cards}`);
  
  // Check for divs with class Card
  const cardDivs = await page.locator('div[class*="border"][class*="bg-card"]').count();
  console.log(`Card-like divs found: ${cardDivs}`);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-homepage.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Check page content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text length:', bodyText?.length);
  console.log('Contains "CueFinder":', bodyText?.includes('CueFinder'));
});
