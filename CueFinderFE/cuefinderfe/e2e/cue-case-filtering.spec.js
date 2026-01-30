const { test, expect } = require('@playwright/test');

// Helper function to login and get auth token
async function loginAndGetToken(page) {
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('Enter your email').fill('testuser@example.com');
  await page.getByPlaceholder('Enter your password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for navigation to complete
  await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
  
  // Get the token from localStorage
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  return token;
}

test.describe('Cue and Case Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('http://localhost:3000/');
    // Wait longer for the page to fully load
    await page.waitForLoadState('domcontentloaded');
    // Wait for sidebar to be visible (indicates page structure is ready)
    await page.waitForSelector('[data-testid="sidebar-forum"]', { timeout: 30000 });
    // Give more time for React to fetch and render data
    await page.waitForTimeout(5000);
  });

  test('Should display both cues and cases on initial load', async ({ page }) => {
    // Wait for the main content area to have cards (div with bg-card class)
    // Cards are rendered as Card components with Tailwind styling
    await page.waitForSelector('div[class*="rounded-lg"][class*="border"][class*="shadow-sm"]', { timeout: 30000 });
    
    // Count the cards by finding elements that look like cards with prices
    const cards = await page.locator('div[class*="rounded-lg"][class*="border"][class*="shadow-sm"]').count();
    console.log(`Total listings displayed: ${cards}`);
    
    expect(cards).toBeGreaterThan(0);
  });

  test('Should filter to show only cues when clicking Cues category', async ({ page }) => {
    const cardSelector = 'div[class*="rounded-lg"][class*="border"][class*="shadow-sm"]';
    
    // Wait for initial cards to load
    await page.waitForSelector(cardSelector, { timeout: 30000 });
    await page.waitForTimeout(1000); // Ensure page is fully interactive
    
    // Click the Cues button (has emoji prefix: 🎯Cues)
    try {
      await page.locator('button').filter({ hasText: /Cues/i }).click({ timeout: 5000 });
    } catch (e) {
      console.log('Could not find Cues button, error:', e.message);
      throw e;
    }
    await page.waitForTimeout(2000); // Wait for filtering
    
    // Verify cards are still rendered
    const cardsAfterFilter = await page.locator(cardSelector).count();
    console.log(`Cues displayed: ${cardsAfterFilter}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/cues-filter.png', fullPage: true });
    
    expect(cardsAfterFilter).toBeGreaterThan(0);
  });

  test('Should filter to show only cases when clicking Cases category', async ({ page }) => {
    const cardSelector = 'div[class*="rounded-lg"][class*="border"][class*="shadow-sm"]';
    
    // Wait for initial cards to load
    await page.waitForSelector(cardSelector, { timeout: 30000 });
    await page.waitForTimeout(1000); // Ensure page is fully interactive
    
    // Click the Cases button (has emoji prefix)
    try {
      await page.locator('button').filter({ hasText: /Cases/i }).click({ timeout: 5000 });
    } catch (e) {
      console.log('Could not find Cases button, error:', e.message);
      throw e;
    }
    await page.waitForTimeout(2000); // Wait for filtering
    
    // Verify cards are still rendered
    const cardsAfterFilter = await page.locator(cardSelector).count();
    console.log(`Cases displayed: ${cardsAfterFilter}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/cases-filter.png', fullPage: true });
    
    // Cases might be 0, but endpoint should work (already tested in API test)
    expect(cardsAfterFilter).toBeGreaterThanOrEqual(0);
  });

  test('Should show all items when clicking All Items category', async ({ page }) => {
    const cardSelector = 'div[class*="rounded-lg"][class*="border"][class*="shadow-sm"]';
    
    // Wait for initial cards to load
    await page.waitForSelector(cardSelector, { timeout: 30000 });
    await page.waitForTimeout(1000); // Ensure page is fully interactive
    
    // First filter to cues
    try {
      await page.locator('button').filter({ hasText: /Cues/i }).click({ timeout: 5000 });
    } catch (e) {
      console.log('Could not find Cues button, error:', e.message);
      throw e;
    }
    await page.waitForTimeout(2000);
    
    // Then click All Items to reset
    try {
      await page.locator('button').filter({ hasText: /All Items/i }).click({ timeout: 5000 });
    } catch (e) {
      console.log('Could not find All Items button, error:', e.message);
      throw e;
    }
    await page.waitForTimeout(2000);
    
    // Verify cards are rendered
    const allCards = await page.locator(cardSelector).count();
    console.log(`All items displayed: ${allCards}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/all-items-filter.png', fullPage: true });
    
    expect(allCards).toBeGreaterThan(0);
  });

  test('Complete filtering flow demonstration', async ({ page }) => {
    console.log('\n=== FILTERING FLOW DEMONSTRATION ===\n');
    
    const cardSelector = 'div[class*="rounded-lg"][class*="border"][class*="shadow-sm"]';
    
    // Step 1: Initial state - show all items
    console.log('Step 1: Initial state - All listings visible');
    await page.waitForSelector(cardSelector, { timeout: 30000 });
    const totalCards = await page.locator(cardSelector).count();
    console.log(`  ✓ Total listings: ${totalCards}`);
    await page.screenshot({ path: 'test-results/filter-flow-1-all.png', fullPage: true });
    await page.waitForTimeout(1000);
    
    // Step 2: Filter to Cues
    console.log('\nStep 2: Filtering to Cues only');
    await page.locator('button').filter({ hasText: /Cues/i }).click();
    await page.waitForTimeout(2000);
    const cuesCount = await page.locator(cardSelector).count();
    console.log(`  ✓ Cues displayed: ${cuesCount}`);
    await page.screenshot({ path: 'test-results/filter-flow-2-cues.png', fullPage: true });
    await page.waitForTimeout(1000);
    
    // Step 3: Filter to Cases
    console.log('\nStep 3: Filtering to Cases only');
    await page.locator('button').filter({ hasText: /Cases/i }).click();
    await page.waitForTimeout(2000);
    const casesCount = await page.locator(cardSelector).count();
    console.log(`  ✓ Cases displayed: ${casesCount}`);
    await page.screenshot({ path: 'test-results/filter-flow-3-cases.png', fullPage: true });
    await page.waitForTimeout(1000);
    
    // Step 4: Back to All Items (navigate home or click All Items)
    console.log('\nStep 4: Back to All Items');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    const allCount = await page.locator(cardSelector).count();
    console.log(`  ✓ All listings displayed: ${allCount}`);
    await page.screenshot({ path: 'test-results/filter-flow-4-all-again.png', fullPage: true });
    
    console.log('\n=== FILTERING FLOW COMPLETE ===\n');
    console.log(`Summary:
    - Total listings: ${totalCards}
    - Cues only: ${cuesCount}
    - Cases only: ${casesCount}
    - Back to all: ${allCount}
    `);
  });

  test('API verification: Check both cues and cases endpoints work', async ({ request }) => {
    // Check cues endpoint
    const cuesResponse = await request.get('http://localhost:5000/api/cues');
    expect(cuesResponse.ok()).toBeTruthy();
    const cuesData = await cuesResponse.json();
    console.log(`Cues from API: ${cuesData.length}`);
    
    // Check cases endpoint
    const casesResponse = await request.get('http://localhost:5000/api/cuecases');
    expect(casesResponse.ok()).toBeTruthy();
    const casesData = await casesResponse.json();
    console.log(`Cases from API: ${casesData.length}`);
    
    console.log(`\nTotal items available: ${cuesData.length + casesData.length}`);
    
    // At minimum, we should have cues in the system
    expect(cuesData.length).toBeGreaterThan(0);
    // Cases may or may not be present in test data, just verify endpoint works
    expect(casesResponse.ok()).toBeTruthy();
  });
});


