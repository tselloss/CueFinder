# CueFinder Testing Scripts

This directory contains various testing and utility scripts for the CueFinder application.

## E2E Testing Scripts

### `run-all-e2e-tests.ps1`
**Comprehensive E2E test runner with Docker health checks**

Runs the complete Playwright E2E test suite with:
- Docker container health verification
- Backend/Frontend readiness checks
- Detailed test reporting
- Multiple execution modes

**Usage:**
```powershell
# Run all tests (headless)
.\run-all-e2e-tests.ps1

# Run with visible browser
.\run-all-e2e-tests.ps1 -Headed

# Run specific test file
.\run-all-e2e-tests.ps1 -TestFile "cue-case-listing.spec.js"

# Debug mode
.\run-all-e2e-tests.ps1 -Debug

# Update snapshots
.\run-all-e2e-tests.ps1 -Update
```

**Features:**
- ✅ Validates Docker containers are running
- ✅ Tests backend API availability
- ✅ Tests frontend availability
- ✅ Colored output for better readability
- ✅ Exit codes for CI/CD integration
- ✅ Automatic report generation

---

### `run-cue-case-tests.ps1`
**Quick test runner for cue case tests only**

Runs only the cue case listing E2E tests for faster iteration during development.

**Usage:**
```powershell
# Run cue case tests
.\run-cue-case-tests.ps1

# With visible browser
.\run-cue-case-tests.ps1 -Headed

# Debug mode
.\run-cue-case-tests.ps1 -Debug
```

**When to use:**
- During cue case feature development
- Quick validation of case functionality
- Debugging case-specific issues

---

## Other Test Scripts

### `run-e2e-tests.ps1`
Standard E2E test runner (original).

### `quick-e2e-test.ps1`
Fast test execution for quick validation.

### `wait-and-test.ps1`
Waits for services to be ready before running tests.

### `run-cue-listing-test.ps1`
Runs only cue listing tests.

---

## Development Scripts

### `dev-start.ps1`
Starts the development environment (backend + frontend + database).

### `reset-and-start.ps1`
Resets database and starts fresh development environment.

---

## Database Scripts

### `fix-database-schema.ps1`
Repairs database schema issues.

### `create-admin-user.ps1`
Creates an admin user in the database.

---

## Test Utilities

### `test-registration-sms.ps1`
Tests SMS verification flow.

### `test-viber-verification.ps1`
Tests Viber verification flow.

### `test-all-fields-registration.ps1`
Tests complete registration with all fields.

---

## Integration Test Scripts

### `run-integration-tests.ps1`
Located in `tests/` directory, runs backend integration tests.

### `run-all-tests.ps1`
Located in `tests/` directory, runs complete test suite (unit + integration).

---

## Quick Reference

### Running All Tests
```powershell
# E2E Tests (Frontend)
.\scripts\run-all-e2e-tests.ps1

# Integration Tests (Backend)
.\tests\run-integration-tests.ps1

# Unit Tests (Backend)
cd CueFinderBE
dotnet test
```

### Common Workflows

#### Feature Development
```powershell
# 1. Start dev environment
.\scripts\dev-start.ps1

# 2. Run relevant tests during development
.\scripts\run-cue-case-tests.ps1 -Headed

# 3. Run full test suite before commit
.\scripts\run-all-e2e-tests.ps1
```

#### Debugging Issues
```powershell
# Run specific test in debug mode
.\scripts\run-all-e2e-tests.ps1 -TestFile "cue-case-listing.spec.js" -Debug

# View test report
cd CueFinderFE\cuefinderfe
npx playwright show-report
```

#### CI/CD Pipeline
```powershell
# Start containers
docker compose up -d

# Run tests (exit code indicates pass/fail)
.\scripts\run-all-e2e-tests.ps1

# Check exit code
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed!"
    exit 1
}
```

---

## Test Coverage

### Current E2E Tests

#### Cue Listings (`user-cue-listing.spec.js`)
- ✅ User registration
- ✅ Login flow
- ✅ Create cue listing
- ✅ Upload images
- ✅ Edit cue listing
- ✅ Delete cue listing
- ✅ Search cues
- ✅ Filter cues

#### Cue Case Listings (`cue-case-listing.spec.js`)
- ✅ Create case listing
- ✅ Edit case listing
- ✅ Delete case listing
- ✅ Case capacity options (1x1, 1x2, 2x4, 3x5, 4x8)
- ✅ Case opening types (Butterfly, Top Open, Side Open, Zipper)
- ✅ Case type options (Soft, Hard, Semi-Hard)
- ✅ Product type selector (Cue vs Case)
- ✅ Conditional field rendering
- ✅ Search cases
- ✅ Filter cases
- ✅ Public browse mode

---

## Prerequisites

### For E2E Tests
1. **Node.js & npm** installed
2. **Playwright** installed:
   ```bash
   cd CueFinderFE/cuefinderfe
   npm install
   npx playwright install
   ```
3. **Docker Desktop** running
4. **Containers running**:
   ```bash
   docker compose up -d
   ```

### For Integration Tests
1. **.NET 8.0 SDK** installed
2. **Docker Desktop** running (for test database)

---

## Troubleshooting

### Tests Failing Due to Services Not Ready
**Solution:** Use `wait-and-test.ps1` which includes readiness checks.

### Port Conflicts
**Solution:** Stop other services on ports 3000, 5000, 5432:
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Docker Container Issues
**Solution:** Restart containers:
```powershell
docker compose down
docker compose up -d
```

### Playwright Browser Issues
**Solution:** Reinstall browsers:
```powershell
npx playwright install --force
```

---

## Documentation

- **E2E Testing Guide:** `docs/E2E_TESTING_CUE_CASES.md`
- **E2E Testing (Original):** `docs/E2E_TESTING_GUIDE.md`
- **Cue Cases Implementation:** `docs/CUE_CASES_IMPLEMENTATION.md`
- **Main README:** `README.md`

---

## Adding New Tests

### Creating a New E2E Test

1. **Create test file** in `CueFinderFE/cuefinderfe/e2e/`:
   ```javascript
   // my-feature.spec.js
   const { test, expect } = require('@playwright/test');
   
   test.describe('My Feature', () => {
     test('should work', async ({ page }) => {
       await page.goto('http://localhost:3000');
       // ... test steps
     });
   });
   ```

2. **Add to test suite:**
   - Test will automatically run with `run-all-e2e-tests.ps1`

3. **Create specific runner** (optional):
   ```powershell
   # scripts/run-my-feature-tests.ps1
   param([switch]$Headed, [switch]$Debug)
   
   cd CueFinderFE/cuefinderfe
   npx playwright test my-feature.spec.js $(if($Headed){" --headed"}) $(if($Debug){" --debug"})
   ```

### Best Practices

1. **Use descriptive test names**
2. **Include setup and cleanup**
3. **Validate via database API**
4. **Add console logging for debugging**
5. **Handle async operations properly**
6. **Use proper selectors** (avoid brittle selectors)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Docker containers
        run: docker compose up -d
        
      - name: Wait for services
        run: Start-Sleep -Seconds 10
        
      - name: Run E2E tests
        run: .\scripts\run-all-e2e-tests.ps1
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: CueFinderFE/cuefinderfe/playwright-report/
```

---

## Support

For issues or questions:
1. Check script output for specific error messages
2. Review Docker logs: `docker compose logs`
3. Check test reports: `npx playwright show-report`
4. Review documentation in `docs/` directory
5. Create an issue in the repository

---

**Last Updated:** January 7, 2026
