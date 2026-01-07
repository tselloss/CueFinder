# OAuth Error 401: invalid_client - Fixed

## Problem

When clicking "Continue with Google", the application showed:
```
Access blocked: Authorization Error
Error 401: invalid_client
The OAuth client was not found.
```

## Root Cause

The application was trying to open Google's real OAuth page with a placeholder client ID (`YOUR_GOOGLE_CLIENT_ID`), which Google rejected because it's not a valid OAuth client registered in Google Cloud Console.

## Solution Applied

**Changed to Demo Mode Only** - The Google sign-in now uses mock authentication immediately without trying to open Google's OAuth page.

### Code Changes

**File**: `CueFinderFE/cuefinderfe/src/components/LoginPage.js`

**Before** (Lines 60-104):
- Opened Google OAuth popup with invalid client ID
- Fallback to mock auth after 1.5 second timeout
- User saw Google error before timeout

**After**:
- Uses mock Google OAuth immediately
- No popup to Google
- Works instantly without errors
- Real OAuth code commented out for future use

## How It Works Now

When you click "Continue with Google":
1. ✅ Creates a mock Google user instantly
2. ✅ Logs you in with `externalLogin()` 
3. ✅ Backend creates/finds user by email
4. ✅ Returns JWT token
5. ✅ Redirects to home page

## To Enable Real Google OAuth Later

Follow these steps when you want real Google authentication:

### 1. Get Google OAuth Credentials

Go to [Google Cloud Console](https://console.cloud.google.com/):

1. Create a new project or select existing
2. Enable **Google+ API**
3. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Authorized JavaScript origins: `http://localhost:3000`
6. Authorized redirect URIs: `http://localhost:3000/oauth-callback`
7. Copy the **Client ID**

### 2. Add Client ID to Environment

Create `CueFinderFE/cuefinderfe/.env.local`:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
```

### 3. Uncomment Real OAuth Code

In `LoginPage.js`, uncomment the block:
```javascript
/* REAL GOOGLE OAUTH CODE (uncomment when you have credentials):
  const width = 500;
  ...
*/
```

And comment out the demo mode code.

### 4. Create OAuth Callback Handler

Create `src/components/OAuthCallback.js` to handle the redirect from Google.

## Current Status

✅ **Demo Mode Active** - Google sign-in works without real credentials
✅ **No More Errors** - No invalid_client error
✅ **Full Backend Integration** - Mock users stored in database
✅ **JWT Authentication** - Token-based auth working

## Testing

1. Click "Continue with Google"
2. Should log you in immediately
3. Check profile page - user info should display
4. Refresh page - should stay logged in (JWT persists)

## Same Fix for Apple

The Apple sign-in button uses the same demo approach and works identically.

## Notes

- Mock emails use timestamp: `google_1234567890@gmail.com`
- Each click creates a new user (by design for testing)
- Backend `ExternalLoginAsync` handles both real and mock OAuth
- Database migration added `ExternalProvider` and `ExternalProviderId` fields

---

**Fixed**: January 6, 2026
**Issue**: OAuth 401 invalid_client error
**Resolution**: Changed to demo mode only (real OAuth code preserved but commented)
