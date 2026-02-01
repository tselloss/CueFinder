/**
 * UI Helper Functions for E2E Tests
 * 
 * Provides reusable functions for common UI interactions
 */

/**
 * Wait for page to be fully loaded
 * @param {Object} page - Playwright page object
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/**
 * Check if element is visible with retry logic
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<boolean>} True if visible
 */
async function isElementVisible(page, selector, timeout = 5000) {
  try {
    const element = page.locator(selector);
    await element.isVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Click element with retry logic
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {number} timeout - Timeout in ms
 */
async function clickElement(page, selector, timeout = 10000) {
  const element = page.locator(selector);
  await element.click({ timeout });
  await page.waitForTimeout(300);
}

/**
 * Fill input field
 * @param {Object} page - Playwright page object
 * @param {string} selector - Input selector
 * @param {string} value - Value to fill
 */
async function fillInput(page, selector, value) {
  const input = page.locator(selector);
  await input.clear();
  await input.fill(value);
}

/**
 * Get text content of element
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @returns {Promise<string>} Text content
 */
async function getElementText(page, selector) {
  return await page.locator(selector).textContent();
}

/**
 * Wait for element to appear and get its text
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<string>} Text content
 */
async function waitAndGetText(page, selector, timeout = 10000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return await element.textContent();
}

/**
 * Click button by text
 * @param {Object} page - Playwright page object
 * @param {string|RegExp} text - Button text
 * @param {number} timeout - Timeout in ms
 */
async function clickButtonByText(page, text, timeout = 10000) {
  const button = page.getByRole('button', { name: text, exact: false });
  await button.click({ timeout });
  await page.waitForTimeout(300);
}

/**
 * Check if element exists
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @returns {Promise<boolean>} True if exists
 */
async function elementExists(page, selector) {
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Get all text from elements matching selector
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @returns {Promise<Array<string>>} Array of text contents
 */
async function getAllElementTexts(page, selector) {
  const elements = page.locator(selector);
  const count = await elements.count();
  const texts = [];
  
  for (let i = 0; i < count; i++) {
    const text = await elements.nth(i).textContent();
    if (text) texts.push(text.trim());
  }
  
  return texts;
}

/**
 * Take screenshot for debugging
 * @param {Object} page - Playwright page object
 * @param {string} filename - Screenshot filename
 */
async function takeScreenshot(page, filename) {
  await page.screenshot({ path: `./test-results/${filename}.png` });
  console.log(`📸 Screenshot saved: ${filename}`);
}

/**
 * Wait for URL to match pattern
 * @param {Object} page - Playwright page object
 * @param {string|RegExp} url - URL pattern
 * @param {number} timeout - Timeout in ms
 */
async function waitForURL(page, url, timeout = 15000) {
  await page.waitForURL(url, { timeout });
  await page.waitForLoadState('networkidle');
}

/**
 * Scroll to element
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 */
async function scrollToElement(page, selector) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * Get number of elements matching selector
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @returns {Promise<number>} Count
 */
async function getElementCount(page, selector) {
  return await page.locator(selector).count();
}

/**
 * Check if element is checked (for checkboxes/radios)
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector
 * @returns {Promise<boolean>} True if checked
 */
async function isElementChecked(page, selector) {
  return await page.locator(selector).isChecked();
}

/**
 * Check a checkbox
 * @param {Object} page - Playwright page object
 * @param {string} selector - Checkbox selector
 */
async function checkCheckbox(page, selector) {
  const checkbox = page.locator(selector);
  if (!(await checkbox.isChecked())) {
    await checkbox.click();
  }
}

/**
 * Uncheck a checkbox
 * @param {Object} page - Playwright page object
 * @param {string} selector - Checkbox selector
 */
async function uncheckCheckbox(page, selector) {
  const checkbox = page.locator(selector);
  if (await checkbox.isChecked()) {
    await checkbox.click();
  }
}

/**
 * Select dropdown option by text
 * @param {Object} page - Playwright page object
 * @param {string} selectSelector - Select element selector
 * @param {string} optionText - Option text to select
 */
async function selectDropdownOption(page, selectSelector, optionText) {
  const selectElement = page.locator(selectSelector);
  await selectElement.selectOption({ label: optionText });
}

/**
 * Upload file to input
 * @param {Object} page - Playwright page object
 * @param {string} inputSelector - File input selector
 * @param {string} filePath - Path to file
 */
async function uploadFile(page, inputSelector, filePath) {
  const fileInput = page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Get value from input element
 * @param {Object} page - Playwright page object
 * @param {string} selector - Input selector
 * @returns {Promise<string>} Input value
 */
async function getInputValue(page, selector) {
  return await page.locator(selector).inputValue();
}

/**
 * Wait for notification/alert to appear
 * @param {Object} page - Playwright page object
 * @param {string|RegExp} text - Alert text pattern
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<string>} Alert text
 */
async function waitForNotification(page, text, timeout = 10000) {
  const notification = page.getByRole('alert').or(
    page.getByText(text)
  );
  await notification.waitFor({ state: 'visible', timeout });
  return await notification.textContent();
}

/**
 * Dismiss alert/notification
 * @param {Object} page - Playwright page object
 * @param {string} closeButtonSelector - Close button selector
 */
async function dismissAlert(page, closeButtonSelector = 'button[aria-label="Close"]') {
  const closeButton = page.locator(closeButtonSelector);
  if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeButton.click();
  }
}

module.exports = {
  waitForPageLoad,
  isElementVisible,
  clickElement,
  fillInput,
  getElementText,
  waitAndGetText,
  clickButtonByText,
  elementExists,
  getAllElementTexts,
  takeScreenshot,
  waitForURL,
  scrollToElement,
  getElementCount,
  isElementChecked,
  checkCheckbox,
  uncheckCheckbox,
  selectDropdownOption,
  uploadFile,
  getInputValue,
  waitForNotification,
  dismissAlert
};
