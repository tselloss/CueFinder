# 🎯 End-to-End Testing - Quick Start

## ⚡ Run Tests in 3 Steps

### Option 1: Fully Automated (Recommended)
```powershell
# Run from the root directory
.\run-e2e-tests.ps1
```
This automatically:
- ✅ Checks and starts PostgreSQL
- ✅ Starts backend
- ✅ Starts frontend  
- ✅ Runs all E2E tests
- ✅ Shows results

### Option 2: Quick Run (If Services Are Running)
```powershell
.\quick-e2e-test.ps1
```

### Option 3: Manual Control
```powershell
# Terminal 1
cd CueFinderBE
dotnet run

# Terminal 2
cd CueFinderFE/cuefinderfe
npm start

# Terminal 3
cd CueFinderFE/cuefinderfe
npx playwright test
```

## 📚 Documentation

- **[E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md)** - Complete guide with troubleshooting
- **[E2E_TEST_SUMMARY.md](E2E_TEST_SUMMARY.md)** - Quick reference and setup
- **[E2E_TEST_FLOW_VISUAL.md](E2E_TEST_FLOW_VISUAL.md)** - Visual diagrams and flows

## ✅ What's Tested

The E2E tests cover the complete user journey:

1. ✅ **Registration** - Create new user account
2. ✅ **Verification** - SMS or social login
3. ✅ **Authentication** - Login with credentials
4. ✅ **Navigation** - Browse cues and search
5. ✅ **Profile** - View user profile
6. ✅ **CRUD Operations** - Add cue functionality
7. ✅ **Admin Features** - Admin panel (for admins)
8. ✅ **Logout** - Sign out and session cleanup

## 🎬 NPM Scripts

```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run with visual UI
npm run test:e2e:headed # Run with browser visible
npm run test:e2e:debug  # Debug mode
npm run test:report     # View test report
```

## 📊 Test Results

After running tests:
```bash
# View HTML report
npx playwright show-report

# Check test results directory
dir test-results/        # Screenshots & videos of failures
dir playwright-report/   # HTML report
```

## 🆘 Need Help?

Check the documentation files above or:

1. **Services not running?** → Use `run-e2e-tests.ps1`
2. **Tests failing?** → Check `E2E_TESTING_GUIDE.md` troubleshooting
3. **Want to customize?** → See `E2E_TEST_SUMMARY.md`
4. **Understand the flow?** → Read `E2E_TEST_FLOW_VISUAL.md`

## 🚀 First Time Setup

```bash
# Install Playwright
cd CueFinderFE/cuefinderfe
npm install -D @playwright/test
npx playwright install

# Run tests
.\run-e2e-tests.ps1
```

That's it! 🎉
