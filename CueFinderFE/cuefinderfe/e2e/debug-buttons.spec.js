const { test } = require('@playwright/test');

test('Debug: Find all buttons on page', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(6000);
  
  console.log('\n=== BUTTON DEBUG ===\n');
  
  // Get all buttons
  const allButtons = await page.locator('button').all();
  console.log(`Total buttons: ${allButtons.length}`);
  
  // Log each button
  for (let i = 0; i < allButtons.length; i++) {
    const text = await allButtons[i].textContent();
    const isVisible = await allButtons[i].isVisible();
    const isHidden = await allButtons[i].isHidden();
    console.log(`Button ${i}: "${text?.trim()}" | visible: ${isVisible} | hidden: ${isHidden}`);
  }
  
  // Try to find Cues button specifically
  console.log('\n=== LOOKING FOR CUES BUTTON ===');
  const cuesButton = page.getByRole('button', { name: /^Cues$/i });
  const cuesCount = await cuesButton.count();
  console.log(`getByRole(button, Cues) count: ${cuesCount}`);
  
  const cuesLocator = page.locator('button').filter({ hasText: /^Cues$/i });
  const cuesLocatorCount = await cuesLocator.count();
  console.log(`locator(button).filter(Cues) count: ${cuesLocatorCount}`);
  
  // Check if sidebar is visible
  const sidebar = page.locator('[data-testid="sidebar-forum"]');
  const sidebarVisible = await sidebar.isVisible();
  console.log(`\nSidebar visible: ${sidebarVisible}`);
});
