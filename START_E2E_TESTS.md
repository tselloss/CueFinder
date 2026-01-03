# 🎯 Quick Start: Run E2E Tests

## ⚡ Fastest Way (Recommended)

```powershell
# From the CueFinder root directory
.\run-e2e-tests.ps1
```

This will:
1. ✅ Check and start all required services (PostgreSQL, Backend, Frontend)
2. ✅ Run all E2E tests
3. ✅ Show results with detailed report
4. ✅ Capture screenshots/videos on failures

## 📖 What Gets Tested?

**Complete User Journey** (11 steps):
1. Load application and login page
2. Switch to registration mode
3. Fill registration form (username, name, email, phone, password)
4. Submit registration (with SMS verification or social login)
5. Verify user is authenticated
6. Navigate to user profile
7. Test search functionality
8. Test add cue form
9. View cue listings
10. Logout
11. Re-login with credentials

**Plus**: Validation errors, admin access, and more!

## 📚 Documentation

- **[E2E_README.md](E2E_README.md)** ← Start here for quick overview
- **[E2E_IMPLEMENTATION_COMPLETE.md](E2E_IMPLEMENTATION_COMPLETE.md)** ← See what was created
- **[E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md)** ← Complete guide with troubleshooting
- **[E2E_TEST_FLOW_VISUAL.md](E2E_TEST_FLOW_VISUAL.md)** ← Visual diagrams

## 🎬 Other Ways to Run

### If Services Are Already Running
```powershell
.\quick-e2e-test.ps1
```

### Manual Control
```powershell
# Terminal 1: Backend
cd CueFinderBE
dotnet run

# Terminal 2: Frontend
cd CueFinderFE\cuefinderfe
npm start

# Terminal 3: Tests
cd CueFinderFE\cuefinderfe
npm run test:e2e
```

### Using NPM Scripts
```bash
cd CueFinderFE\cuefinderfe

npm run test:e2e        # Run all tests
npm run test:e2e:ui     # Visual UI mode
npm run test:e2e:headed # See browser
npm run test:e2e:debug  # Debug mode
npm run test:report     # View report
```

## 🔍 View Test Results

```bash
# After tests run, view the HTML report
cd CueFinderFE\cuefinderfe
npx playwright show-report
```

## ✅ First Time Setup

If this is your first time:

```powershell
# 1. Install Playwright browsers
cd CueFinderFE\cuefinderfe
npx playwright install

# 2. Run tests
cd ..\..
.\run-e2e-tests.ps1
```

## 🆘 Troubleshooting

**Tests won't run?**
→ Check [E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md) troubleshooting section

**Services not starting?**
→ Use the automated runner: `.\run-e2e-tests.ps1`

**Playwright not found?**
→ Run: `npx playwright install`

## 🎉 That's It!

You're ready to test the complete user registration and authentication flow!

**Run now**: `.\run-e2e-tests.ps1` 🚀
