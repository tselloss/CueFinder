# ✅ E2E Testing Readiness Checklist

Use this checklist to verify your E2E testing setup is complete and ready to run.

## 📦 Installation Checklist

- [x] **Node.js installed**
  - Check: `node --version`
  
- [x] **NPM dependencies installed**
  - Location: `CueFinderFE/cuefinderfe`
  - Check: `npm list @playwright/test`
  
- [ ] **Playwright browsers installed**
  - Run: `cd CueFinderFE/cuefinderfe && npx playwright install`
  - Check: `npx playwright --version`

## 🗂️ File Verification Checklist

### Test Files
- [x] `CueFinderFE/cuefinderfe/e2e/user-registration-flow.spec.js`
- [x] `CueFinderFE/cuefinderfe/src/__tests__/e2e/UserRegistrationFlow.test.js`
- [x] `CueFinderFE/cuefinderfe/playwright.config.js`

### Documentation Files
- [x] `START_E2E_TESTS.md`
- [x] `E2E_README.md`
- [x] `E2E_IMPLEMENTATION_COMPLETE.md`
- [x] `E2E_TESTING_GUIDE.md`
- [x] `E2E_TEST_SUMMARY.md`
- [x] `E2E_TEST_FLOW_VISUAL.md`

### Script Files
- [x] `run-e2e-tests.ps1`
- [x] `quick-e2e-test.ps1`

### Configuration
- [x] `CueFinderFE/cuefinderfe/package.json` (updated with scripts)

## 🚀 Service Readiness Checklist

### Database
- [ ] **PostgreSQL running**
  - Check: `docker ps | grep cuefinder-postgres`
  - Or: `Get-NetTCPConnection -LocalPort 5432`
  - Start: `docker start cuefinder-postgres`

### Backend
- [ ] **Backend running on port 5000**
  - Check: `Get-NetTCPConnection -LocalPort 5000`
  - Start: `cd CueFinderBE && dotnet run`
  - Verify: Open `http://localhost:5000/api` in browser

### Frontend
- [ ] **Frontend running on port 3000**
  - Check: `Get-NetTCPConnection -LocalPort 3000`
  - Start: `cd CueFinderFE/cuefinderfe && npm start`
  - Verify: Open `http://localhost:3000` in browser

## 🧪 Test Execution Checklist

### Before Running Tests
- [ ] All services are running (or use automated runner)
- [ ] No port conflicts (5432, 5000, 3000)
- [ ] Database has migrations applied
- [ ] Backend can connect to database

### Run Tests
- [ ] **Option 1**: Run `.\run-e2e-tests.ps1` (automated)
- [ ] **Option 2**: Run `.\quick-e2e-test.ps1` (quick)
- [ ] **Option 3**: Run `npm run test:e2e` manually

### After Running Tests
- [ ] All 4 tests passed
- [ ] HTML report generated
- [ ] No error screenshots (unless testing failure scenarios)
- [ ] Test results visible in console

## 📊 Expected Test Results

```
Expected output:
  ✓ Complete user journey: Register -> Login -> Use App -> Logout
  ✓ Registration validation: Show error for existing username
  ✓ Direct login with valid credentials
  ✓ Admin user can access admin page

  4 passed (23s)
```

## 🔍 Verification Commands

Run these to verify setup:

```powershell
# Check Node.js
node --version

# Check NPM
npm --version

# Check Playwright
cd CueFinderFE\cuefinderfe
npx playwright --version

# Check PostgreSQL
docker ps | grep cuefinder-postgres

# Check Backend (should return JSON)
curl http://localhost:5000/api

# Check Frontend (should return HTML)
curl http://localhost:3000

# List installed packages
npm list --depth=0
```

## 🎯 Quick Test Run

Once everything above is checked:

```powershell
# Easiest way - automated
.\run-e2e-tests.ps1

# Or if services are running
.\quick-e2e-test.ps1

# Or manual
cd CueFinderFE\cuefinderfe
npm run test:e2e
```

## 📖 Documentation Review Checklist

Have you read:
- [ ] `START_E2E_TESTS.md` - Quick start guide
- [ ] `E2E_README.md` - Overview and commands
- [ ] `E2E_IMPLEMENTATION_COMPLETE.md` - What was created

Optional detailed reading:
- [ ] `E2E_TESTING_GUIDE.md` - Complete guide
- [ ] `E2E_TEST_SUMMARY.md` - Detailed summary
- [ ] `E2E_TEST_FLOW_VISUAL.md` - Visual diagrams

## 🐛 Troubleshooting Checklist

If tests fail, check:
- [ ] All services are running
- [ ] Ports are not blocked by firewall
- [ ] Database connection string is correct
- [ ] Backend can access database
- [ ] Frontend can access backend
- [ ] No compilation errors in backend/frontend
- [ ] Playwright browsers are installed

## ✅ Final Verification

Run this complete check:

```powershell
# 1. Check Playwright
cd CueFinderFE\cuefinderfe
npx playwright --version

# 2. Check services
docker ps
Get-NetTCPConnection -LocalPort 5432,5000,3000

# 3. Run a quick test
npm run test:e2e

# 4. View report
npx playwright show-report
```

## 🎉 Ready to Go!

If all items are checked, you're ready to run E2E tests!

**Recommended first run:**
```powershell
.\run-e2e-tests.ps1
```

This will automatically handle service startup and run all tests.

---

**Status**: Setup Complete ✅  
**Ready to Test**: Yes 🚀  
**Next Step**: Run `.\run-e2e-tests.ps1`
