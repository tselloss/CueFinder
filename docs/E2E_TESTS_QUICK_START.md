# CueFinder E2E Test Suite - Quick Start Guide

## 🎯 What's Included

I've created a comprehensive end-to-end test suite for your CueFinder application with tests for:

✅ **User Registration & Login**
✅ **Add Multiple Listing Types** (cues, tables, accessories)
✅ **Edit Listings**
✅ **Edit User Profile**
✅ **Forum Navigation**
✅ **Create Forum Topics**
✅ **Add Forum Replies**
✅ **Menu & Bar Visibility**
✅ **Dropdown Menus**
✅ **Mobile Responsive Menus**

## 📁 Files Created

```
CueFinderFE/cuefinderfe/e2e/
├── helpers/
│   ├── authHelper.js              # Reusable auth functions
│   ├── dataHelper.js              # API & data utilities
│   └── uiHelper.js                # UI interaction helpers
├── complete-user-journey.spec.js       # Auth & listings tests
├── forum-complete-flow.spec.js         # Forum tests
├── ui-components-visibility.spec.js    # Menu & UI tests
├── run-tests.js                        # Node test runner
├── run-e2e-tests.ps1                  # PowerShell test runner
└── README_E2E_TESTS.md                 # Full documentation
```

## 🚀 Quick Start

### Prerequisites

Make sure your services are running:

```bash
# Terminal 1: Backend
cd CueFinderBE
dotnet run

# Terminal 2: Frontend
cd CueFinderFE/cuefinderfe
npm start

# Terminal 3: Database (if using Docker)
docker-compose up postgres
```

### Run Tests

From `CueFinderFE/cuefinderfe/`:

```bash
# Basic run (headless - no visible browser)
npm run test:e2e

# Watch tests execute in browser
npm run test:e2e:headed

# Debug mode with step-by-step execution
npm run test:e2e:debug

# Interactive UI mode
npm run test:e2e:ui

# View test report after running
npm run test:report
```

### Or Use Test Runners

**PowerShell (Windows):**
```powershell
# From CueFinderFE/cuefinderfe/e2e/
.\run-e2e-tests.ps1
.\run-e2e-tests.ps1 -Mode Headed
.\run-e2e-tests.ps1 -Test Forum
```

**Node.js:**
```bash
# From CueFinderFE/cuefinderfe/e2e/
node run-tests.js
node run-tests.js --headed
node run-tests.js --debug
```

## 📊 Test Breakdown

### 1️⃣ **Complete User Journey** (`complete-user-journey.spec.js`)

7 test steps:
1. Register new user via API
2. Login via UI
3. Add multiple listing types (3 items)
4. Edit a listing via UI
5. Edit user profile
6. Verify menus and UI elements
7. Logout

**Duration:** 5-10 minutes

### 2️⃣ **Forum Flow** (`forum-complete-flow.spec.js`)

8 test steps:
1. Get forum categories
2. Register and login user
3. Navigate to forum UI
4. Create new forum topic/discussion
5. Add reply/post to discussion
6. Verify posts are visible
7. Check forum navigation and menus
8. Test filtering and sorting

**Duration:** 8-12 minutes

### 3️⃣ **UI Components** (`ui-components-visibility.spec.js`)

8 test steps:
1. Navigation bar visibility (logged out)
2. Sidebar menu toggle
3. Dropdown menus expand/collapse
4. Forum dropdown and categories
5. Profile menu visibility
6. Modal dialogs open/close
7. Mobile responsive menu (375px)
8. Navigation bar after authentication

**Duration:** 5-8 minutes

## 🛠️ Helper Functions

All helpers are exported and reusable:

### Auth Helper
```javascript
const { loginViaUI, generateUniqueUser, getAuthToken, isLoggedIn } = require('./helpers/authHelper');
```

### Data Helper
```javascript
const { createListing, createForumDiscussion, getForumCategories } = require('./helpers/dataHelper');
```

### UI Helper
```javascript
const { clickButtonByText, fillInput, takeScreenshot, waitForPageLoad } = require('./helpers/uiHelper');
```

## 📋 Test Features

✨ **Automatic Test Data Generation**
- Creates unique users with timestamps
- Avoids conflicts between test runs
- Example: `testuser_1704067200000`

📸 **Screenshots & Videos**
- Auto screenshots on failure
- Video recordings available
- Stored in `test-results/`

🔍 **Detailed Logging**
- Console output shows every step
- Timestamps for debugging
- Success/failure indicators

📊 **HTML Reports**
```bash
npm run test:report
```

Shows:
- Passed/failed tests
- Execution time
- Screenshots
- Video recordings
- Error messages

## 🔧 Configuration

### Change Test Timeouts
Edit `playwright.config.js`:
```javascript
timeout: 600000  // Global timeout (10 minutes)
```

### Override API/App URLs
```bash
export API_BASE_URL=http://your-api:5200/api
export APP_BASE_URL=http://your-app:3000
```

## 🐛 Troubleshooting

### Backend Not Found
```
Error: Failed to connect to http://127.0.0.1:5200
```
**Solution:** Make sure backend is running on port 5200

### Login Fails
**Solution:** Run in headed mode to see the login form:
```bash
npm run test:e2e:headed
```

### Tests Timeout
**Solution:** 
- Increase timeout in playwright.config.js
- Check if page is loading slowly
- Look for JavaScript errors in browser console

### Forum Tests Fail
**Solution:** Make sure forum categories are seeded in database:
```sql
SELECT * FROM forum_categories;
```

## 📖 Full Documentation

See `CueFinderFE/cuefinderfe/e2e/README_E2E_TESTS.md` for:
- Detailed test descriptions
- All helper function signatures
- CI/CD integration examples
- Best practices
- Performance metrics

## 💡 Example: Running Just Forum Tests

```bash
# Edit playwright.config.js to only run forum tests
npx @playwright/test forum-complete-flow.spec.js --headed
```

Or modify test file selection in `run-e2e-tests.ps1`

## ✅ Next Steps

1. **Set up services** - Make sure backend, frontend, and database are running
2. **Run basic test** - `npm run test:e2e`
3. **Check report** - `npm run test:report`
4. **Add to CI/CD** - See documentation for GitHub Actions example
5. **Customize** - Modify tests for your specific needs

## 📞 Getting Help

If tests fail:

1. Check the error message in console
2. Look at screenshots in `test-results/`
3. Run in debug mode: `npm run test:e2e:debug`
4. Check HTML report: `npm run test:report`
5. Review test logs in terminal output

## 🎉 You're All Set!

Your E2E test suite is ready. Start with:

```bash
cd CueFinderFE/cuefinderfe
npm run test:e2e
```

Good luck! 🚀
