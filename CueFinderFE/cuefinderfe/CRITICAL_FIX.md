# CRITICAL FIX IDENTIFIED: Token Persistence Solution

## Root Cause
Tests are failing because **tokens obtained from API login are not being stored in localStorage** before the UI tries to use them. This causes:
- "No auth token found in cookies or localStorage" warnings
- Failed API calls with "User ID not found in token" errors
- Inability to create listings after login

## Solution Pattern (Already in Codebase!)

The correct pattern exists in `register-login-add-table.spec.js`:

```javascript
// 1. Get token from API login
const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, { ... });
const authToken = loginResponse.token || loginResponse.accessToken;

// 2. Set token in browser BEFORE navigating
await page.addInitScript((token) => {
  localStorage.setItem('authToken', token);
}, authToken);

// 3. Now load the app
await page.goto(`${APP_BASE_URL}/#/profile`);
```

## Why Tests Fail

Failing tests do this (WRONG):
```javascript
// Click Sign In button
await page.click('button:has-text("Sign In")');
// ... try to fill forms ...
// Token is obtained by backend BUT:
// - Not returned to client
// - Not stored in localStorage
// - Subsequent actions fail
```

## Implementation Steps

### Step 1: Update add-cue-and-case.spec.js
Import the authHelper and use API-based login + localStorage setup:

```javascript
const { loginUser, registerUser, setAuthToken } = require('./helpers/authHelper');

test('1. Add Cue Listing via API + UI', async ({ page, request }) => {
  // Setup: Register and login via API
  await registerUser(request, testUser);
  const token = await loginUser(request, testUser.username, testUser.password);
  
  // Set token in localStorage BEFORE navigating
  await page.addInitScript((authToken) => {
    localStorage.setItem('authToken', authToken);
  }, token);
  
  // Now navigate - user is already "logged in"
  await page.goto('http://localhost:3000');
  
  // Find and click Add Listing button
  const addButton = page.locator('button').filter({ hasText: /add.*listing/i });
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();
  
  // ... rest of test ...
});
```

### Step 2: Update other failing tests
Apply same pattern to:
- cue-case-listing.spec.js
- cue-case-complete-flow.spec.js  
- Any test showing "No auth token found" warning

### Step 3: Use authHelper functions consistently
All tests should use:
- `registerUser(request, userData)` - API registration
- `loginUser(request, email, password)` - API login  
- `setAuthToken(page, token)` - Store token in localStorage
- `loginViaUI(page, email, password)` - Only for testing the login UI itself

## Files That Show Correct Pattern
✅ register-login-add-table.spec.js (WORKING)
✅ helpers/authHelper.js (Has all helper functions)
✅ httpClient.js (Client-side token storage)

## Expected Improvement
After applying this fix:
- Tests that previously got "token not found" will pass
- "Add Listing" modals will open properly
- UI tests will have authenticated session
- Pass rate should increase from 53% to 75%+

## Quick Validation
Run a single test to verify fix works:
```bash
npx playwright test e2e/add-cue-and-case.spec.js::1 --reporter=line
```

Should show PASS with no "No auth token found" warnings.
