# Frontend Problem Details Integration Guide

## Overview

The backend now returns errors in **RFC 7807 Problem Details** format. The frontend has been updated to properly handle and display these errors to users.

## What Changed

### 1. Enhanced HTTP Client (`src/utils/httpClient.js`)

The `makeRequest` function now properly extracts error information from Problem Details responses:

```javascript
// Problem Details format (RFC 7807)
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

The client extracts messages in this order:
1. `detail` (most specific)
2. `title` (fallback)
3. `message` or `error` (legacy format)
4. First validation error from `errors` object
5. HTTP status code fallback

### 2. Error Utilities (`src/utils/errorUtils.js`)

New utility functions for consistent error handling:

#### Core Functions

- **`getErrorMessage(error, fallbackMessage)`**
  - Extracts user-friendly message from any error format
  - Supports Problem Details, standard errors, and HTTP status codes
  
- **`getValidationErrors(error)`**
  - Returns object mapping field names to error messages
  - Example: `{ "Username": ["Required"], "Email": ["Invalid format"] }`

- **`formatValidationErrors(error)`**
  - Returns formatted string of validation errors
  - Example: `"Username: Required\nEmail: Invalid format"`

#### Helper Functions

- **`isValidationError(error)`** - Check if error is 400 or 422
- **`isAuthError(error)`** - Check if error is 401
- **`isPermissionError(error)`** - Check if error is 403
- **`isNotFoundError(error)`** - Check if error is 404
- **`isErrorStatus(error, statusCode)`** - Check specific status

### 3. Updated Components

#### LoginPage.js
```javascript
import { getErrorMessage, isValidationError, formatValidationErrors } from '../utils/errorUtils';

try {
  await login(username, password);
} catch (err) {
  const errorMessage = getErrorMessage(err, 'Login failed');
  
  if (isValidationError(err)) {
    const validationDetails = formatValidationErrors(err);
    if (validationDetails) {
      setError(`${errorMessage}\n${validationDetails}`);
    } else {
      setError(errorMessage);
    }
  } else {
    setError(errorMessage);
  }
}
```

#### UserProfile.js
Similar pattern applied for profile updates with validation error display.

## How to Update Other Components

For any component that makes API calls and handles errors:

### Basic Error Handling

```javascript
import { getErrorMessage } from '../utils/errorUtils';

try {
  await someApiCall();
} catch (error) {
  const message = getErrorMessage(error, 'Operation failed');
  setError(message);
}
```

### With Validation Errors

```javascript
import { getErrorMessage, isValidationError, formatValidationErrors } from '../utils/errorUtils';

try {
  await someApiCall();
} catch (error) {
  const message = getErrorMessage(error, 'Operation failed');
  
  if (isValidationError(error)) {
    const validationDetails = formatValidationErrors(error);
    if (validationDetails) {
      setError(`${message}\n\n${validationDetails}`);
    } else {
      setError(message);
    }
  } else {
    setError(message);
  }
}
```

### Check Specific Error Types

```javascript
import { isAuthError, isNotFoundError, getErrorMessage } from '../utils/errorUtils';

try {
  await someApiCall();
} catch (error) {
  if (isAuthError(error)) {
    // Handle authentication error
    navigate('/login');
  } else if (isNotFoundError(error)) {
    // Handle not found
    setError('Resource not found');
  } else {
    // Generic error handling
    setError(getErrorMessage(error));
  }
}
```

## Components to Update

Review and update these components to use the error utilities:

- ✅ **LoginPage.js** - Updated
- ✅ **UserProfile.js** - Updated
- ⚠️ **CueFormModal.js** - Still uses `error.response?.data?.message`
- ⚠️ **MyCues.js** - Uses basic `error.message`
- ⚠️ **AdminPage.js** - Check error handling
- ⚠️ **PhoneVerificationModal.js** - Check error handling
- ⚠️ Service files (`authService.js`, `cueService.js`, etc.) - May need updates

## Testing Error Handling

### Test Invalid Login
1. Go to login page
2. Enter invalid credentials
3. Should see: "Invalid username or password" (from Problem Details)

### Test Validation Errors
1. Try to register with short password
2. Should see specific validation errors like:
   - "Password must be at least 8 characters"
   - Field-specific errors listed

### Test Network Errors
1. Stop backend server
2. Try any action
3. Should see appropriate timeout or connection error

## Example Error Responses

### Validation Error (400)
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Username": ["Username is required"],
    "Password": ["Password must be at least 8 characters"]
  }
}
```

### Business Logic Error (409)
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "Username 'john_doe' is already taken"
}
```

### Authentication Error (401)
```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid username or password"
}
```

## Best Practices

1. **Always use `getErrorMessage()`** for displaying errors to users
2. **Check for validation errors** when submitting forms
3. **Provide fallback messages** for better UX
4. **Don't expose technical details** to end users in production
5. **Log full error objects** to console for debugging
6. **Test all error scenarios** during development

## Migration Checklist

- [x] Update `httpClient.js` to parse Problem Details
- [x] Create `errorUtils.js` with helper functions
- [x] Update `LoginPage.js`
- [x] Update `UserProfile.js`
- [ ] Update `CueFormModal.js`
- [ ] Update `MyCues.js`
- [ ] Update `AdminPage.js`
- [ ] Update service files if needed
- [ ] Test all error scenarios
- [ ] Update error display UI if needed (consider toast notifications)

## Future Enhancements

Consider implementing:
- Global error boundary for React
- Toast notification system (react-toastify, grommet notifications)
- Error logging service (Sentry, LogRocket)
- Retry logic for failed requests
- Offline detection and handling
