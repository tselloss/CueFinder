# End-to-End Testing Guide

This guide covers running end-to-end tests for the CueFinder application, testing the complete user journey from registration to authentication and app navigation.

## 📋 Test Coverage

The E2E tests cover:
1. **User Registration** - Creating a new user account
2. **SMS Verification** - Phone number verification flow
3. **User Authentication** - Login with credentials
4. **App Navigation** - Browsing cues, searching, filtering
5. **User Profile** - Accessing and viewing profile
6. **Add Cue** - Creating new cue listings
7. **Admin Access** - Admin-specific features (for admin users)
8. **Logout** - Signing out and session cleanup

## 🎯 Test Types

### 1. Unit/Integration Tests (React Testing Library)
Location: `src/__tests__/e2e/UserRegistrationFlow.test.js`

These tests use mocked APIs and are fast to run.

### 2. Real Browser E2E Tests (Playwright)
Location: `e2e/user-registration-flow.spec.js`

These tests run against real backend and frontend instances.

## 🚀 Prerequisites

### For All Tests:
- Node.js installed
- Dependencies installed: `npm install`

### For Playwright Tests:
1. **Backend Running**
   - Navigate to: `CueFinderBE`
   - Run: `dotnet run`
   - Should be accessible at: `http://localhost:5000`

2. **Database Running**
   - PostgreSQL must be running
   - Default connection: `localhost:5432`
   - Database: `cuefinder`
   - User: `postgres`
   - Password: `admin`

3. **Frontend Running**
   - Navigate to: `CueFinderFE/cuefinderfe`
   - Run: `npm start`
   - Should be accessible at: `http://localhost:3000`

4. **Playwright Installed**
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

## 🧪 Running Tests

### Option 1: React Testing Library Tests (Unit/Integration)

```bash
# Navigate to frontend directory
cd CueFinderFE/cuefinderfe

# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- UserRegistrationFlow.test.js
```

### Option 2: Playwright E2E Tests (Real Browser)

#### Step 1: Start the Backend
```bash
# In terminal 1
cd CueFinderBE
dotnet run
```

Wait for: `Now listening on: http://localhost:5000`

#### Step 2: Start the Database
```bash
# If using Docker
docker ps  # Verify postgres container is running

# Or start it
docker start cuefinder-postgres
```

#### Step 3: Start the Frontend
```bash
# In terminal 2
cd CueFinderFE/cuefinderfe
npm start
```

Wait for: `webpack compiled successfully`

#### Step 4: Run Playwright Tests
```bash
# In terminal 3
cd CueFinderFE/cuefinderfe

# Run all E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test user-registration-flow.spec.js

# Run with headed browser (see the browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run single test
npx playwright test --grep "Complete user journey"
```

## 📊 Understanding Test Results

### Successful Test Output
```
Running 4 tests using 1 worker
✓ user-registration-flow.spec.js:26:3 › Complete user journey (15s)
✓ user-registration-flow.spec.js:230:3 › Registration validation (3s)
✓ user-registration-flow.spec.js:250:3 › Direct login (2s)
✓ user-registration-flow.spec.js:262:3 › Admin access (3s)

4 passed (23s)
```

### Test Reports
- Playwright generates HTML reports at: `playwright-report/index.html`
- Open with: `npx playwright show-report`
- Screenshots on failure: `test-results/`
- Videos on failure: `test-results/`

## 🐛 Troubleshooting

### Backend Not Running
**Error**: `Error: page.goto: net::ERR_CONNECTION_REFUSED`

**Solution**:
```bash
cd CueFinderBE
dotnet run
```

### Database Connection Error
**Error**: Tests fail with "Connection refused" or "Database not found"

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps

# Start PostgreSQL
docker start cuefinder-postgres

# Verify connection string in appsettings.json
# Default: Host=localhost;Port=5432;Database=cuefinder;Username=postgres;Password=admin
```

### Frontend Not Running
**Error**: `Error: page.goto: NS_ERROR_CONNECTION_REFUSED`

**Solution**:
```bash
cd CueFinderFE/cuefinderfe
npm start
```

### Playwright Not Installed
**Error**: `browserType.launch: Executable doesn't exist`

**Solution**:
```bash
npx playwright install
```

### Port Already in Use
**Error**: `Port 3000 is already in use` or `Port 5000 is already in use`

**Solution**:
```powershell
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

### SMS Verification in Tests
The tests use the social login feature (Apple/Google) which bypasses SMS verification for testing purposes. This creates an admin user automatically.

If you want to test actual registration:
1. Modify the backend to accept a test verification code
2. Or disable SMS verification in development mode
3. Or use a test SMS service

## 🔧 Customizing Tests

### Adding New Test Cases
1. Open `e2e/user-registration-flow.spec.js`
2. Add a new test:
```javascript
test('My new test case', async ({ page }) => {
  // Your test code here
  await page.goto('http://localhost:3000');
  // ... more test steps
});
```

### Changing Test User Credentials
Edit the `testUser` object in the test file:
```javascript
const testUser = {
  username: `myuser_${Date.now()}`,
  password: 'MySecurePass123!',
  name: 'My Test User',
  email: `myemail${Date.now()}@example.com`,
  phone: '+1234567890',
};
```

## 📸 Test Artifacts

Playwright automatically captures:
- **Screenshots** on test failure
- **Videos** of failed tests
- **Traces** for debugging

Access them in: `test-results/` directory

## 🎬 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: cuefinder
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: admin
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-dotnet@v3
      
      - name: Install Dependencies
        run: |
          cd CueFinderFE/cuefinderfe
          npm install
          npx playwright install --with-deps
      
      - name: Start Backend
        run: |
          cd CueFinderBE
          dotnet run &
        
      - name: Start Frontend
        run: |
          cd CueFinderFE/cuefinderfe
          npm start &
          
      - name: Wait for Services
        run: Start-Sleep -Seconds 30
        
      - name: Run E2E Tests
        run: |
          cd CueFinderFE/cuefinderfe
          npx playwright test
          
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📝 Test Scenarios Covered

### Complete User Journey Test
1. ✅ Load login page
2. ✅ Switch to registration mode
3. ✅ Fill registration form
4. ✅ Submit registration (via social login for testing)
5. ✅ Verify user is logged in
6. ✅ Navigate to profile page
7. ✅ Test search functionality
8. ✅ Test add cue form
9. ✅ Verify cue listings
10. ✅ Logout
11. ✅ Re-login with credentials

### Validation Tests
- ✅ Error handling for existing username
- ✅ Form validation messages
- ✅ Invalid credentials handling

### Role-Based Tests
- ✅ Regular user access
- ✅ Admin user access to admin panel
- ✅ Role-specific features

## 🎯 Best Practices

1. **Always start services before running tests**
   - Backend → Database → Frontend → Tests

2. **Use unique test data**
   - Tests generate unique usernames with timestamps
   - Prevents conflicts from repeated test runs

3. **Clean up test data**
   - Consider adding database cleanup in `afterAll()`
   - Or use database transactions that rollback

4. **Run tests in isolation**
   - Each test should be independent
   - Don't rely on state from previous tests

5. **Use meaningful test names**
   - Describe what the test does
   - Use "should" or action phrases

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io)

## ✅ Quick Start Checklist

- [ ] PostgreSQL running on port 5432
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Playwright installed: `npx playwright install`
- [ ] Run tests: `npx playwright test`
- [ ] View report: `npx playwright show-report`

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.
