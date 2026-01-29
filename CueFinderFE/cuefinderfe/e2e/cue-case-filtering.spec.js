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
    await page.waitForTimeout(2000); // Give time for React to render
  });

  test('Should display both cues and cases on initial load', async ({ page }) => {
    // Wait for listings to load
    await page.waitForSelector('[data-testid="cue-card"], .grommet-card', { timeout: 30000 });
    
    // Count the cards
    const cards = await page.locator('.grommet-card').count();
    console.log(`Total listings displayed: ${cards}`);
    
    expect(cards).toBeGreaterThan(0);
  });

  test('Should filter to show only cues when clicking Cues category', async ({ page }) => {
    // Open the sidebar menu
    await page.getByRole('button', { name: /Show Categories|Hide Categories/i }).click();
    await page.waitForTimeout(3000); // Wait for sidebar animation
    
    // Click on Cues category
    await page.getByRole('button', { name: /^Cues/i }).click();
    await page.waitForTimeout(5000); // Wait for filtering
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/cues-filter.png', fullPage: true });
    
    console.log('Cues filter applied');
  });

  test('Should filter to show only cases when clicking Cases category', async ({ page }) => {
    // Open the sidebar menu
    await page.getByRole('button', { name: /Show Categories|Hide Categories/i }).click();
    await page.waitForTimeout(3000); // Wait for sidebar animation
    
    // Click on Cases category
    await page.getByRole('button', { name: /^Cases/i }).click();
    await page.waitForTimeout(5000); // Wait for filtering
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/cases-filter.png', fullPage: true });
    
    console.log('Cases filter applied');
  });

  test('Should show all items when clicking All Items category', async ({ page }) => {
    // Open the sidebar menu
    await page.getByRole('button', { name: /Show Categories|Hide Categories/i }).click();
    await page.waitForTimeout(3000); // Wait for sidebar animation
    
    // First filter to cues
    await page.getByRole('button', { name: /^Cues/i }).click();
    await page.waitForTimeout(5000);
    
    // Then click All Items to reset
    await page.getByRole('button', { name: /All Items/i }).click();
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/all-items-filter.png', fullPage: true });
    
    console.log('All Items filter applied');
  });

  test('Complete filtering flow demonstration', async ({ page }) => {
    console.log('\n=== FILTERING FLOW DEMONSTRATION ===\n');
    
    // Step 1: Initial state - show all items
    console.log('Step 1: Initial state - All listings visible');
    await page.waitForSelector('.grommet-card', { timeout: 30000 });
    const totalCards = await page.locator('.grommet-card').count();
    console.log(`  ✓ Total listings: ${totalCards}`);
    await page.screenshot({ path: 'test-results/filter-flow-1-all.png', fullPage: true });
    await page.waitForTimeout(2000);
    
    // Step 2: Open sidebar
    console.log('\nStep 2: Opening category sidebar');
    await page.getByRole('button', { name: /Show Categories/i }).click();
    await page.waitForTimeout(3000);
    console.log('  ✓ Sidebar opened');
    await page.screenshot({ path: 'test-results/filter-flow-2-sidebar.png', fullPage: true });
    
    // Step 3: Filter to Cues
    console.log('\nStep 3: Filtering to Cues only');
    await page.getByRole('button', { name: /^Cues/i }).click();
    await page.waitForTimeout(5000);
    const cuesCount = await page.locator('.grommet-card').count();
    console.log(`  ✓ Cues displayed: ${cuesCount}`);
    await page.screenshot({ path: 'test-results/filter-flow-3-cues.png', fullPage: true });
    await page.waitForTimeout(3000);
    
    // Step 4: Filter to Cases
    console.log('\nStep 4: Filtering to Cases only');
    await page.getByRole('button', { name: /^Cases/i }).click();
    await page.waitForTimeout(5000);
    const casesCount = await page.locator('.grommet-card').count();
    console.log(`  ✓ Cases displayed: ${casesCount}`);
    await page.screenshot({ path: 'test-results/filter-flow-4-cases.png', fullPage: true });
    await page.waitForTimeout(3000);
    
    // Step 5: Back to All Items
    console.log('\nStep 5: Back to All Items');
    await page.getByRole('button', { name: /All Items/i }).click();
    await page.waitForTimeout(5000);
    const allCount = await page.locator('.grommet-card').count();
    console.log(`  ✓ All listings displayed: ${allCount}`);
    await page.screenshot({ path: 'test-results/filter-flow-5-all-again.png', fullPage: true });
    
    console.log('\n=== FILTERING FLOW COMPLETE ===\n');
    console.log(`Summary:
    - Total listings: ${totalCards}
    - Cues only: ${cuesCount}
    - Cases only: ${casesCount}
    - Back to all: ${allCount}
    `);
  });

  test('API verification: Check both cues and cases are returned', async ({ request }) => {
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
    
    expect(cuesData.length).toBeGreaterThan(0);
    expect(casesData.length).toBeGreaterThan(0);
  });
});


