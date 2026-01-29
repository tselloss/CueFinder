# CueFinder E2E Test Suite Documentation

## Overview

This document describes the comprehensive end-to-end (E2E) test suite for the CueFinder application. The tests cover all major user workflows including registration, authentication, listings management, profile updates, and forum interactions.

## Test Structure

```
e2e/
├── helpers/
│   ├── authHelper.js           # Authentication utilities
│   ├── dataHelper.js           # API and data utilities
│   └── uiHelper.js             # UI interaction utilities
├── complete-user-journey.spec.js    # User registration → login → listings
├── forum-complete-flow.spec.js      # Forum topics and replies
├── ui-components-visibility.spec.js # Menu and component visibility
├── run-tests.js                     # Node.js test runner
├── run-e2e-tests.ps1               # PowerShell test runner
└── README_E2E_TESTS.md             # This file
```

## Test Files

### 1. `complete-user-journey.spec.js` - User Registration & Listings Flow

**Scope:**
- Register new user
- Login via UI
- Create multiple listing types (cues, tables, accessories)
- Edit existing listing
- Edit user profile
- Verify UI menus and navigation
- Logout

**Duration:** ~5-10 minutes

**Key Features:**
- Unique user generation for each test run
- Multiple item type creation
- Profile update verification
- UI element visibility checks

### 2. `forum-complete-flow.spec.js` - Forum Interactions

**Scope:**
- Get available forum categories
- Register and login user
- Navigate to forum
- Create new forum topic/discussion
- Add reply to discussion
- Verify post visibility
- Test forum navigation and menus
- Test filtering and sorting

**Duration:** ~8-12 minutes

**Key Features:**
- Dynamic category selection
- Post creation and verification
- Forum navigation testing
- Category filtering tests

### 3. `ui-components-visibility.spec.js` - UI Component Tests

**Scope:**
- Navigation bar visibility (authenticated and unauthenticated)
- Sidebar menu toggle functionality
- Dropdown menu expand/collapse
- Forum dropdown and categories
- Profile menu interactions
- Modal dialog operations
- Mobile responsive menu (375px viewport)

**Duration:** ~5-8 minutes

**Key Features:**
- Desktop and mobile testing
- Menu state verification
- Dropdown interaction testing
- Modal open/close cycles
- Responsive design validation

## Helper Functions

### `authHelper.js`

Authentication and user management utilities:

```javascript
// Register a new user
await registerUser(request, userData)

// Login via API
await loginUser(request, emailOrUsername, password)

// Login via UI (browser)
await loginViaUI(page, emailOrUsername, password)

// Generate unique user with timestamp
const user = generateUniqueUser('prefix')

// Get/set auth token in localStorage
const token = await getAuthToken(page)
await setAuthToken(page, token)

// Check if user is logged in
const loggedIn = await isLoggedIn(page)

// Logout user
await logout(page)
```

### `dataHelper.js`

Data creation and API utilities:

```javascript
// Listings
await createListing(request, token, itemData)
await getListings(request)
await updateListing(request, token, id, updateData)
await deleteListing(request, token, id)

// Profile
await getUserProfile(request, token)
await updateUserProfile(request, token, profileData)

// Forum
await createForumDiscussion(request, token, discussionData)
await createForumPost(request, token, postData)
await getForumCategories(request)
await getCategoryDiscussions(request, categoryId)
await getDiscussionPosts(request, discussionId)

// Sample data generators
const listing = generateSampleListing(itemType)
const discussion = generateSampleDiscussion()
const post = generateSamplePost()
```

### `uiHelper.js`

UI interaction utilities:

```javascript
// Wait and verify
await waitForPageLoad(page)
await isElementVisible(page, selector, timeout)
await elementExists(page, selector)

// Interactions
await clickElement(page, selector, timeout)
await fillInput(page, selector, value)
await clickButtonByText(page, text, timeout)

// Information retrieval
await getElementText(page, selector)
await getAllElementTexts(page, selector)
await getElementCount(page, selector)

// Forms
await checkCheckbox(page, selector)
await selectDropdownOption(page, selectSelector, optionText)
await uploadFile(page, inputSelector, filePath)

// Screenshots
await takeScreenshot(page, filename)
```

## Running Tests

### Prerequisites

1. **Backend** running at `http://localhost:5200`
2. **Frontend** running at `http://localhost:3000`
3. **PostgreSQL database** initialized
4. **Forum categories** seeded in the database

### Quick Start

```bash
# Install dependencies (if needed)
npm install

# Run all e2e tests (headless)
npm run test:e2e

# Run tests with browser visible
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run tests in interactive UI mode
npm run test:e2e:ui

# View HTML report
npm run test:report
```

### Using Test Runner Scripts

#### Node.js Runner

```bash
# Run all tests
node e2e/run-tests.js

# Run with browser visible
node e2e/run-tests.js --headed

# Debug mode
node e2e/run-tests.js --debug

# Interactive UI
node e2e/run-tests.js --ui
```

#### PowerShell Runner (Windows)

```powershell
# Run all tests
.\e2e\run-e2e-tests.ps1

# Run with browser visible
.\e2e\run-e2e-tests.ps1 -Mode Headed

# Specific test
.\e2e\run-e2e-tests.ps1 -Test Forum

# Debug mode
.\e2e\run-e2e-tests.ps1 -Mode Debug

# Show report after completion
.\e2e\run-e2e-tests.ps1 -ShowReport
```

### npm Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "test:e2e": "npx @playwright/test test",
    "test:e2e:ui": "npx @playwright/test test --ui",
    "test:e2e:headed": "npx @playwright/test test --headed",
    "test:e2e:debug": "npx @playwright/test test --debug",
    "test:report": "npx @playwright/test show-report"
  }
}
```

## Test Data Management

Each test uses unique data generated with timestamps:

```javascript
const testUser = generateUniqueUser('prefix_')
// Result: { username: 'prefix_1704067200000', email: 'prefix_1704067200000@test.com', ... }
```

This ensures:
- No conflicts between test runs
- Easy test data identification
- Automatic cleanup through database retention policies

## Environment Variables

Set these to override defaults:

```bash
# API base URL (default: http://127.0.0.1:5200/api)
export API_BASE_URL=http://your-api:5200/api

# App base URL (default: http://127.0.0.1:3000)
export APP_BASE_URL=http://your-app:3000
```

## Configuration

Edit `playwright.config.js` to customize:

```javascript
// Timeouts (in milliseconds)
timeout: 600000            // Global test timeout
navigationTimeout: 60000   // Navigation wait
actionTimeout: 20000       // Action wait

// Browser options
slowMo: 500               // Slow down by 500ms (good for debugging)

// Recording
screenshot: 'on'          // Always take screenshots
video: 'retain-on-failure' // Record video on failure
trace: 'on-first-retry'   // Trace on first retry
```

## Troubleshooting

### Tests Won't Run

**Error:** "No tests found"
- Ensure test files end with `.spec.js`
- Check file paths in playwright.config.js

**Error:** "Backend not reachable"
- Verify backend is running on the correct port
- Check `API_BASE_URL` environment variable
- Test with: `curl http://localhost:5200/api/auth/register`

### Login Fails

**Issue:** Login button not found
- Check if UI selectors have changed
- Run test in headed mode to see what's on screen: `npm run test:e2e:headed`
- Verify login endpoint is accessible

### Tests Timeout

**Issue:** Tests hang at waiting for elements
- Increase `timeout` in playwright.config.js
- Run in headed mode to see browser state
- Check browser console for JavaScript errors
- Verify elements exist with correct selectors

### Forum Tests Fail

**Issue:** "Forum categories not found"
- Verify forum categories are seeded in the database
- Run: `SELECT * FROM forum_categories;` in your database
- Check if API endpoint `/api/forum/categories` returns data

## Debugging

### Headed Mode (Show Browser)

```bash
npm run test:e2e:headed
```

Watch the browser and see exactly what's happening.

### Debug Mode

```bash
npm run test:e2e:debug
```

Pauses execution with Playwright Inspector. Step through code line by line.

### Interactive UI Mode

```bash
npm run test:e2e:ui
```

Beautiful UI for selecting and running specific tests.

### Verbose Logging

Tests already include `console.log()` statements. View them in terminal output.

### Take Screenshots

All tests include `takeScreenshot()` calls. Screenshots save to:

```
test-results/
├── complete-user-journey.spec.js-audit_*
├── forum-complete-flow.spec.js-*
└── ui-components-visibility.spec.js-*
```

View HTML report:

```bash
npm run test:report
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-report
          path: test-results/
```

## Best Practices

1. **Use Unique Data:** Tests generate unique usernames/emails to avoid conflicts
2. **Wait for Network:** Use `waitForLoadState('networkidle')` after major actions
3. **Explicit Waits:** Prefer waiting for elements over fixed delays
4. **Page Resets:** Return to home/clean state between test sections
5. **Error Logging:** Check console logs for JavaScript errors
6. **Screenshot on Failure:** Tests automatically capture screenshots
7. **Clean Test Data:** Consider adding database cleanup between test runs

## Test Maintenance

### Adding New Tests

1. Create new `.spec.js` file in `e2e/` directory
2. Import helpers: `const { ... } = require('./helpers/...')`
3. Use `test.describe()` and `test()` from Playwright
4. Follow existing patterns for consistency

### Updating Selectors

If UI changes, update selectors in tests:

```javascript
// Old
const button = page.getByRole('button', { name: 'Login' })

// If that changes, try alternatives:
const button = page.locator('[data-testid="login-button"]')
const button = page.locator('button.btn-primary')
```

### Test Data Generators

Add new sample data generators to `dataHelper.js`:

```javascript
function generateSampleForum() {
  return {
    // your data structure
  }
}
```

## Performance Metrics

Typical test execution times:

| Test Suite | Duration | Count |
|-----------|----------|-------|
| Complete User Journey | 5-10 min | 7 steps |
| Forum Flow | 8-12 min | 8 steps |
| UI Components | 5-8 min | 8 steps |
| **Total** | **20-30 min** | **23 steps** |

## Reporting

### HTML Reports

Generated automatically in `test-results/`

```bash
npm run test:report
```

Shows:
- ✓ Passed tests
- ✗ Failed tests with error details
- Screenshots for debugging
- Timing information
- Video recordings (on failure)

### Console Output

Detailed logs printed to console during execution:

```
🚀 STEP 1: Register New User
Registering: e2e_user_1704067200000
✓ Registration response status: 200
✓ Token received from registration
```

## Support & Issues

For issues or questions:

1. Check test output and screenshots
2. Run failing test in debug mode: `npm run test:e2e:debug`
3. Check browser console in headed mode: `npm run test:e2e:headed`
4. Review test logs in `test-results/`

## Future Enhancements

- [ ] API performance baseline tests
- [ ] Load testing with multiple concurrent users
- [ ] Visual regression testing with Percy
- [ ] Database state validation
- [ ] Email verification tests
- [ ] Payment/transaction tests
- [ ] Search functionality tests
- [ ] Notification tests

## Changelog

- **v1.0** - Initial comprehensive test suite
  - Auth & user journey tests
  - Forum interaction tests
  - UI component visibility tests
  - Helper utilities for reusable code
