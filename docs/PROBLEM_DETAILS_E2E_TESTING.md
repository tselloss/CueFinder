# Problem Details E2E Testing Guide

## Overview

This guide explains how to run the comprehensive E2E tests that visualize and verify the Problem Details error handling integration in the CueFinder application.

## Prerequisites

### 1. Services Must Be Running

```powershell
# Start all services
docker compose up -d

# Or start individually
docker compose up backend -d
docker compose up frontend -d
docker compose up db -d
```

Verify services are running:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Database**: localhost:5432

### 2. Install Playwright (if not already installed)

```bash
cd CueFinderFE/cuefinderfe
npm install @playwright/test
npx playwright install
```

## Running the Tests

### Option 1: Quick Run with Script (RECOMMENDED)

The easiest way to run the tests:

```powershell
# From project root
.\scripts\test-problem-details.ps1
```

This will:
1. Check if services are running
2. Offer you multiple options:
   - **Headed mode** - See the browser
   - **Slow motion** - Watch each step (1 second delays)
   - **Headless** - Fast, no UI
   - **Specific test** - Run just one test

Choose **Option 2 (Slow Motion)** for the best visualization!

### Option 2: Manual Run

```bash
cd CueFinderFE/cuefinderfe

# Run all tests in headed mode
npx playwright test problem-details-error-handling.spec.js --headed

# Run with slow motion (1000ms delays) - BEST FOR WATCHING
npx playwright test problem-details-error-handling.spec.js --headed --slow-mo=1000

# Run headless (fast)
npx playwright test problem-details-error-handling.spec.js

# Run specific test
npx playwright test problem-details-error-handling.spec.js --headed --grep="Invalid Credentials"
```

### Option 3: Debug Mode

Run in debug mode to step through the test:

```bash
npx playwright test problem-details-error-handling.spec.js --debug
```

This opens Playwright Inspector where you can:
- Step through each action
- Inspect elements
- See the console output
- View network requests

## What the Tests Do

### Test 1: Invalid Login (401 Unauthorized) ✅

**What it tests:**
- Attempts login with invalid credentials
- Verifies backend returns Problem Details with status 401
- Checks that error message is displayed to user

**Expected Result:**
- Error message: "Invalid username or password" (or similar)
- Screenshot: `test-results/error-401-invalid-login.png`

**What you'll see:**
1. Login page loads
2. Invalid credentials entered
3. Submit button clicked
4. Error message appears in UI
5. Console shows Problem Details JSON

### Test 2: Short Password Validation (400 Bad Request) ✅

**What it tests:**
- Attempts registration with password too short
- Verifies backend returns validation errors
- Checks field-specific error messages

**Expected Result:**
- Error message: "Password must be at least 8 characters" (or similar)
- Screenshot: `test-results/error-400-validation-password.png`

**What you'll see:**
1. Registration form loads
2. Short password entered (e.g., "123")
3. Form submitted
4. Validation error displayed
5. Console shows Problem Details with `errors` object

### Test 3: Duplicate Username (409 Conflict) ✅

**What it tests:**
- Registers a user successfully
- Attempts to register again with same username
- Verifies backend returns 409 Conflict

**Expected Result:**
- Error message: "Username already exists" (or similar)
- Screenshot: `test-results/error-409-duplicate-username.png`

**What you'll see:**
1. First registration succeeds
2. Second registration with same username
3. Conflict error displayed
4. Console shows 409 Problem Details

### Test 4: Invalid Email Format (400 Validation) ✅

**What it tests:**
- Logs in as admin
- Attempts to update profile with invalid email
- Verifies validation error is shown

**Expected Result:**
- Error message: "Invalid email format" (or similar)
- Screenshot: `test-results/error-400-invalid-email.png`

**What you'll see:**
1. Login successful
2. Navigate to profile
3. Invalid email entered (e.g., "not-an-email")
4. Validation error displayed

### Test 5: Network Error (Connection Failed) ✅

**What it tests:**
- Simulates backend being unavailable
- Verifies network error handling
- Checks user-friendly error message

**Expected Result:**
- Error message: "Network error" or "Connection failed"
- Screenshot: `test-results/error-network-failure.png`

**What you'll see:**
1. Login page loads
2. Backend requests are blocked (simulated)
3. Network error displayed

### Test 6: Multiple Validation Errors ✅

**What it tests:**
- Submits form with multiple invalid fields
- Verifies all validation errors are returned
- Checks that errors are displayed properly

**Expected Result:**
- Multiple error messages shown
- Screenshot: `test-results/error-400-multiple-validation.png`

**What you'll see:**
1. Registration form with multiple invalid fields
2. Form submitted
3. Multiple validation errors displayed
4. Console shows all errors in `errors` object

### Test 7: Cache Headers Verification ✅

**What it tests:**
- Makes API requests
- Checks for Cache-Control headers
- Verifies caching is configured

**Expected Result:**
- Console shows cache headers: `Cache-Control`, `ETag`, etc.

## Understanding the Test Output

### Console Output

The tests print detailed information:

```
🧪 TEST: Invalid Login Credentials
📍 On login page
📝 Entered invalid credentials
📥 API Response (Problem Details):
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid username or password"
}
✅ Error displayed to user: Invalid username or password
⏸️  Pausing for 3 seconds to visualize the error...
📸 Screenshot saved: test-results/error-401-invalid-login.png
```

### Screenshots

All error screenshots are saved in `test-results/` directory:
- `error-401-invalid-login.png`
- `error-400-validation-password.png`
- `error-409-duplicate-username.png`
- `error-400-invalid-email.png`
- `error-network-failure.png`
- `error-400-multiple-validation.png`

### HTML Report

After tests complete:

```bash
npx playwright show-report
```

This opens an interactive HTML report showing:
- All test results
- Screenshots on failure
- Console logs
- Network requests
- Timeline of actions

## Verifying Problem Details Integration

### What to Look For

#### 1. Backend Response Structure ✅

In console output, check the API response:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "Username is required",
  "errors": {
    "Username": ["Username is required"],
    "Password": ["Password must be at least 8 characters"]
  }
}
```

**Key Fields:**
- ✅ `type` - RFC 7807 URI reference
- ✅ `title` - Human-readable summary
- ✅ `status` - HTTP status code
- ✅ `detail` - Specific error description
- ✅ `errors` - Field-specific validation errors (if applicable)

#### 2. Frontend Error Display ✅

In the browser/screenshots, verify:
- ✅ Error message is user-friendly
- ✅ No technical details exposed (stack traces, etc.)
- ✅ Validation errors show which field is invalid
- ✅ Error message matches `detail` or `title` from Problem Details

#### 3. Error Handling Flow ✅

Watch the test execution to confirm:
1. ✅ API request is made
2. ✅ Backend returns Problem Details JSON
3. ✅ Frontend extracts error message
4. ✅ Error is displayed in UI
5. ✅ User sees helpful message

## Testing Different Error Scenarios

### Test Invalid Login

```bash
npx playwright test --headed --slow-mo=1000 --grep="Invalid Credentials"
```

### Test Validation Errors

```bash
npx playwright test --headed --slow-mo=1000 --grep="Validation"
```

### Test Conflict Errors

```bash
npx playwright test --headed --slow-mo=1000 --grep="Duplicate"
```

### Test All Error Scenarios

```bash
npx playwright test problem-details-error-handling.spec.js --headed
```

## Troubleshooting

### Tests Fail with "page.goto: net::ERR_CONNECTION_REFUSED"

**Problem**: Frontend is not running.

**Solution**:
```bash
docker compose up frontend -d
```

### Tests Fail with Network Errors

**Problem**: Backend is not running or not accessible.

**Solution**:
```bash
docker compose up backend -d

# Verify backend is responding
curl http://localhost:5000/api/health
```

### Tests Pass but Error Messages Not Visible

**Problem**: Frontend might not be properly handling errors.

**Solution**:
1. Check browser console for JavaScript errors
2. Verify `errorUtils.js` is imported in components
3. Check that components are using `getErrorMessage()` function

### Validation Errors Not Showing

**Problem**: Backend might not be returning Problem Details format.

**Solution**:
1. Check backend `Program.cs` has `AddCueFinderProblemDetails()`
2. Verify backend controllers are using proper validation
3. Check backend logs for errors

### Screenshots Are Blank

**Problem**: Timing issue - page not fully loaded.

**Solution**:
- Run with `--slow-mo=2000` for slower execution
- Check if elements have correct selectors
- Increase timeout values in test

## Verifying Cache Headers

To see cache headers in test output:

```bash
npx playwright test --headed --grep="Cache Headers"
```

Look for console output like:

```
📥 Login Response Headers:
  Cache-Control: no-cache
  
📥 Cues Response Headers:
  Cache-Control: public, max-age=300
  ETag: "abc123..."
  ✅ Cache headers are present!
```

## Next Steps

After running these tests:

1. ✅ **Verify all tests pass** - All error scenarios handled correctly
2. ✅ **Check screenshots** - Errors are user-friendly
3. ✅ **Review console logs** - Problem Details structure is correct
4. ✅ **Test manually** - Try the same scenarios in browser
5. ⚠️ **Update remaining components** - Apply error handling to other components

## Additional Resources

- **Test File**: `CueFinderFE/cuefinderfe/e2e/problem-details-error-handling.spec.js`
- **Error Utils**: `CueFinderFE/cuefinderfe/src/utils/errorUtils.js`
- **HTTP Client**: `CueFinderFE/cuefinderfe/src/utils/httpClient.js`
- **Integration Guide**: `docs/FRONTEND_PROBLEM_DETAILS_INTEGRATION.md`
- **Caching Guide**: `docs/CACHING_STRATEGY.md`

## Example: Running the Full Test Suite

```powershell
# 1. Start services
docker compose up -d

# 2. Run Problem Details tests (with visualization)
.\scripts\test-problem-details.ps1

# 3. Choose option 2 (slow motion)

# 4. Watch the browser as it:
#    - Tests invalid login → See error message
#    - Tests validation → See field-specific errors
#    - Tests conflicts → See "already exists" message
#    - Tests network errors → See connection failure
#    - Verifies cache headers → See console output

# 5. Review results
npx playwright show-report
```

## Success Criteria

Your Problem Details integration is working correctly if:

✅ All tests pass
✅ Error messages are displayed in UI
✅ Messages are user-friendly (no stack traces)
✅ Validation errors show which fields are invalid
✅ Console logs show proper Problem Details JSON
✅ Screenshots show clear error messages
✅ Cache headers are present (if caching enabled)

## Summary

This test suite provides **visual confirmation** that:
- ✅ Backend returns RFC 7807 Problem Details
- ✅ Frontend extracts error messages correctly
- ✅ Users see helpful, user-friendly error messages
- ✅ Validation errors are displayed properly
- ✅ Network errors are handled gracefully
- ✅ Caching headers are sent correctly

**Run the tests in slow motion mode to see everything in action!** 🎬
