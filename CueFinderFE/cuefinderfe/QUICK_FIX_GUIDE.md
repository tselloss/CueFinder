# Quick Fix Guide for E2E Tests

## The One-Line Summary
Replace **UI-based login** with **API login + localStorage setup** in all tests.

## Before (❌ WRONG - Tests fail with "No auth token found")
```javascript
test('Example test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Sign In")');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Token is NOT in localStorage - subsequent API calls fail!
  await createListing(page); // ❌ FAILS: No token
});
```

## After (✅ CORRECT - Tests work reliably)
```javascript
const { loginUser } = require('./helpers/authHelper');

test('Example test', async ({ page, request }) => {
  // 1. Get token from API
  const token = await loginUser(request, email, password);
  
  // 2. Set token in browser
  await page.addInitScript((authToken) => {
    localStorage.setItem('authToken', authToken);
  }, token);
  
  // 3. Navigate - user is already logged in!
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Token IS in localStorage - subsequent API calls work!
  await createListing(page); // ✅ PASSES: Token available
});
```

## Copy-Paste Template

```javascript
const { test, expect } = require('@playwright/test');
const { registerUser, loginUser } = require('./helpers/authHelper');

const API_BASE_URL = 'http://127.0.0.1:5000/api';
const APP_BASE_URL = 'http://localhost:3000';

test.describe('My Tests', () => {
  const testUser = {
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    acceptedTerms: true
  };

  test.beforeAll(async ({ request }) => {
    // Register user once
    await registerUser(request, testUser);
  });

  test('Example action', async ({ page, request }) => {
    // Get token
    const token = await loginUser(request, testUser.username, testUser.password);
    expect(token).toBeTruthy();
    
    // Set in browser
    await page.addInitScript((authToken) => {
      localStorage.setItem('authToken', authToken);
    }, token);
    
    // Navigate
    await page.goto(APP_BASE_URL);
    
    // Do your test here
  });
});
```

## Common Selector Fixes

### Before (Wrong)
```javascript
// These don't work reliably:
await page.click('button:has-text("Billiard Cue")');
await page.locator('h4:has-text("Billiard Cue")').click();
```

### After (Correct)
```javascript
// Use .filter() and .waitFor():
const card = page.locator('h4').filter({ hasText: 'Billiard Cue' });
await card.waitFor({ state: 'visible', timeout: 10000 });
await card.click();

// Or for buttons:
const btn = page.locator('button').filter({ hasText: /add.*listing/i });
await btn.waitFor({ state: 'visible', timeout: 10000 });
await btn.click();
```

## Quick Checklist for Every Test Fix

- [ ] Import authHelper: `const { registerUser, loginUser } = require('./helpers/authHelper');`
- [ ] Get token: `const token = await loginUser(request, user.username, user.password);`
- [ ] Set in localStorage: Use `page.addInitScript()` before `page.goto()`
- [ ] Remove UI login code (the `button:has-text("Sign In")` part)
- [ ] Add `.waitFor({ state: 'visible' })` before all clicks
- [ ] Use `.filter({ hasText: ... })` instead of `:has-text(...)`
- [ ] Test: `npx playwright test e2e/your-file.spec.js`

## Test Files Ready to Copy From

✅ **Use these as templates** (already working with auth fix):
- `register-login-add-table.spec.js` - lines 75-84 show the pattern
- `cue-case-api.spec.js` - good reference for API calls

✅ **In Progress**:
- `add-cue-and-case.spec.js` - partially refactored, review for any issues

## Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "No auth token found" | UI login not storing token | Use API login + addInitScript |
| "User ID not found in token" | Token lost after navigation | Set token before page.goto() |
| "Timeout waiting for button" | Button not visible | Add `.waitFor({ state: 'visible' })` |
| "Locator not found" | Wrong selector | Use `.filter()` instead of `:has-text()` |
| "Failed to read 'localStorage'" | Cross-origin issue | Use `page.evaluate()` within try-catch |

## When You're Done

1. Run the test: `npx playwright test e2e/yourfile.spec.js --reporter=list`
2. Should see: ✅ PASSED
3. Look for: No "No auth token found" warnings
4. Then: Move to next failing test and repeat

## Questions?

See detailed docs:
- `COMPREHENSIVE_FIX_SUMMARY.md` - Full technical details
- `CRITICAL_FIX.md` - Root cause analysis
- `TEST_FIX_ANALYSIS.md` - Test failure categories

