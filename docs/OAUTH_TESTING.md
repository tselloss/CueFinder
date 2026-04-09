# OAuth Testing Guide

This document describes the testing strategy for Google OAuth authentication in CueFinder.

## Test Files

### 1. Integration Tests (`tests/integration/oauth-callback.test.js`)

**Purpose**: Unit-level tests for OAuth token parsing logic

**Tests**:
- ✅ Extract tokens from hash fragment (standard OAuth 2.0 implicit flow)
- ✅ Extract tokens from pathname (Google's non-standard behavior)
- ✅ Decode JWT ID token payload
- ✅ Store OAuth data in sessionStorage (main window redirect)
- ✅ Send postMessage to opener (popup redirect)
- ✅ Handle OAuth errors in URL parameters

**Run**: 
```bash
npm test -- oauth-callback.test.js
# or
jest tests/integration/oauth-callback.test.js
```

### 2. E2E Tests (`tests/e2e/google-oauth.spec.js`)

**Purpose**: End-to-end tests using Playwright to verify full OAuth flow

**Tests**:
- ✅ Display Google login button
- ✅ Handle OAuth callback with tokens in pathname
- ✅ Handle OAuth callback with tokens in hash
- ✅ Handle OAuth errors (access_denied)
- ✅ Handle missing tokens gracefully
- ✅ Validate route pattern `/iss=/*` is configured

**Run**:
```bash
cd CueFinderFE/cuefinderfe
npx playwright test google-oauth.spec.js
```

## OAuth Flow Architecture

### Standard Flow (Popup)
```
1. User clicks "Continue with Google" button
2. LoginPage opens popup window (500x600)
3. Popup navigates to Google OAuth URL
4. User signs in on Google
5. Google redirects popup to /oauth-callback#access_token=...&id_token=...
6. OAuthCallback extracts tokens from hash
7. OAuthCallback decodes ID token to get user info
8. OAuthCallback sends postMessage to parent window
9. Popup closes
10. LoginPage receives message, calls backend API
11. Backend validates token and returns JWT
12. User logged in, redirect to home
```

### Fallback Flow (Main Window Redirect)
```
1. User clicks "Continue with Google" button
2. Popup blocked or Google redirects main window
3. Google redirects to /iss=https://accounts.google.com&access_token=...&id_token=...
4. React Router matches /iss=/* route
5. OAuthCallback detects no window.opener
6. OAuthCallback stores data in sessionStorage
7. OAuthCallback redirects to /login
8. LoginPage checks sessionStorage on mount
9. LoginPage processes OAuth data from sessionStorage
10. LoginPage calls backend API
11. User logged in, redirect to home
```

## Known Issues & Solutions

### Issue 1: Tokens in Pathname
**Problem**: Google returns OAuth tokens in URL pathname instead of hash fragment
```
/iss=https://accounts.google.com&access_token=ya29...&id_token=eyJ...
```

**Solution**: 
- Added route pattern `/iss=/*` in App.js
- OAuthCallback checks pathname first, then hash, then search params

### Issue 2: Main Window Redirect
**Problem**: Google sometimes redirects the main window instead of popup

**Solution**:
- OAuthCallback checks for `window.opener`
- If no opener, stores data in sessionStorage and redirects to /login
- LoginPage checks sessionStorage on mount and processes stored OAuth data

### Issue 3: Router Warning
**Problem**: React Router requires `/*` not `*` after path prefix

**Solution**: Changed route from `/iss=*` to `/iss=/*`

## Manual Testing Checklist

### Local Development (localhost:3000)

- [ ] Navigate to http://localhost:3000/login
- [ ] Click "Continue with Google"
- [ ] Popup opens (500x600 centered)
- [ ] Sign in with Google account
- [ ] Popup closes automatically
- [ ] Redirected to home page
- [ ] User logged in (check localStorage for token)
- [ ] User info displayed in navbar

### Error Scenarios

- [ ] Click Google button, deny access → Error message shown
- [ ] Block popup → Main window redirect works
- [ ] Invalid token → Appropriate error message
- [ ] Network error → Graceful fallback

### Production Testing (billiardscuefinder.com)

- [ ] Same checklist as local development
- [ ] HTTPS redirect URIs working
- [ ] No CORS errors in console
- [ ] Production Google OAuth credentials correct

## Debugging OAuth Issues

### Browser Console Logs
Look for these debug messages from OAuthCallback:
```javascript
OAuth Callback - Full URL: http://localhost:3000/iss=https://accounts.google.com&...
OAuth Callback - Hash: 
OAuth Callback - Search: 
OAuth Callback - Pathname: /iss=https://accounts.google.com&...
ID Token found: true
Access Token found: true
OAuth callback in main window, redirecting...
```

### Backend API Logs
Check backend logs for external-login API calls:
```bash
docker logs cuefinder-backend --tail 100 | grep -i "external.*login"
```

### Network Tab
- Check redirect from Google to your app
- Verify `/api/auth/external-login` POST request
- Confirm JWT token in response

### Common Errors

**"No routes matched location"**
- Route pattern missing or incorrect
- Should be `/iss=/*` not `/iss=*`

**"No opener window found"**
- Normal when Google redirects main window
- Should fall back to sessionStorage

**"invalid_client"**
- Client ID/Secret mismatch
- Check environment variables: `REACT_APP_GOOGLE_CLIENT_ID`, `GoogleOAuth__ClientId`

**"redirect_uri_mismatch"**
- OAuth redirect URI doesn't match Google Cloud Console
- Must be exactly: `http://localhost:3000/oauth-callback` or `https://billiardscuefinder.com/oauth-callback`

## Test Data

### Mock ID Token Structure
```json
{
  "iss": "https://accounts.google.com",
  "aud": "390019490259-o1bkohlkn9endfcomlk7t5ao0car57uh.apps.googleusercontent.com",
  "sub": "1078968022306754061922",
  "email": "vageliskarac@gmail.com",
  "email_verified": true,
  "name": "Vagelis Karac",
  "picture": "https://lh3.googleusercontent.com/a/...",
  "given_name": "Vagelis",
  "family_name": "Karac",
  "iat": 1775565380,
  "exp": 1775568980
}
```

## Continuous Integration

Add to GitHub Actions workflow:
```yaml
- name: Run OAuth Integration Tests
  run: npm test -- oauth-callback.test.js
  
- name: Run OAuth E2E Tests
  run: |
    docker-compose up -d
    cd CueFinderFE/cuefinderfe
    npx playwright test google-oauth.spec.js
```

## Security Considerations

- ✅ Client Secret never exposed in frontend code
- ✅ postMessage origin validated (`event.origin === window.location.origin`)
- ✅ ID token validated on backend via Google's public keys
- ✅ JWT token has 60-minute expiry
- ✅ sessionStorage cleared immediately after use
- ✅ OAuth tokens never stored in localStorage (only backend JWT)

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Implicit Flow](https://oauth.net/2/grant-types/implicit/)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [CueFinder OAuth Setup](../GOOGLE_OAUTH_SETUP.md)
