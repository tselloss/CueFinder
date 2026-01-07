# Setting Up Real Google OAuth Authentication

This guide will walk you through setting up **real Google OAuth** for CueFinder.

## Prerequisites

- Google Account
- Application running on `http://localhost:3000`

---

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
Open: https://console.cloud.google.com/

### 1.2 Create New Project
1. Click the project dropdown (top left, next to "Google Cloud")
2. Click "NEW PROJECT"
3. Enter project name: **CueFinder**
4. Click "CREATE"
5. Wait for project creation, then select it from the dropdown

---

## Step 2: Enable Required APIs

### 2.1 Enable Google+ API
1. In left sidebar: **APIs & Services** → **Library**
2. Search for: `Google+ API`
3. Click on it
4. Click **ENABLE**

---

## Step 3: Configure OAuth Consent Screen

### 3.1 Go to Consent Screen
1. In left sidebar: **APIs & Services** → **OAuth consent screen**

### 3.2 Configure User Type
1. Select **External**
2. Click **CREATE**

### 3.3 Fill App Information
**Page 1: App information**
- App name: `CueFinder`
- User support email: Your email address
- App logo: (optional, skip for now)
- Developer contact information: Your email address
- Click **SAVE AND CONTINUE**

**Page 2: Scopes**
- Click **ADD OR REMOVE SCOPES**
- Select:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- Click **UPDATE**
- Click **SAVE AND CONTINUE**

**Page 3: Test users**
- Click **+ ADD USERS**
- Add your email address (the one you'll use to test login)
- Add any other test users
- Click **ADD**
- Click **SAVE AND CONTINUE**

**Page 4: Summary**
- Review and click **BACK TO DASHBOARD**

---

## Step 4: Create OAuth Client ID

### 4.1 Go to Credentials
1. In left sidebar: **APIs & Services** → **Credentials**

### 4.2 Create Credentials
1. Click **+ CREATE CREDENTIALS** (top)
2. Select **OAuth client ID**

### 4.3 Configure OAuth Client
**Application type:** `Web application`

**Name:** `CueFinder Web Client`

**Authorized JavaScript origins:**
```
http://localhost:3000
```
Click **+ ADD URI** if you need to add more

**Authorized redirect URIs:**
```
http://localhost:3000/oauth-callback
```

### 4.4 Create and Copy Client ID
1. Click **CREATE**
2. A popup will show your credentials
3. **COPY** the Client ID (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
4. Click **OK**

---

## Step 5: Configure Your Application

### 5.1 Create Environment File
In your project root: `CueFinderFE/cuefinderfe/`

Create file: `.env.local`

```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

**Replace `YOUR_CLIENT_ID_HERE` with the actual Client ID you copied**

Example:
```env
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
```

### 5.2 Restart Development Server

If using npm:
```bash
cd CueFinderFE/cuefinderfe
npm start
```

If using Docker:
```bash
cd CueFinder
docker-compose down
docker-compose up -d --build
```

---

## Step 6: Test OAuth Login

### 6.1 Open Application
Navigate to: http://localhost:3000

### 6.2 Click "Continue with Google"
1. Click the Google button
2. A popup window should open
3. Select your Google account
4. You may see a warning "Google hasn't verified this app" - this is normal for testing
5. Click **Continue** (or **Advanced** → **Go to CueFinder**)
6. Grant permissions (email, profile)
7. Popup will close automatically
8. You should be logged in!

---

## Troubleshooting

### Error: "Google OAuth not configured"
- Check that `.env.local` file exists
- Check that Client ID is correctly pasted
- Restart the development server

### Error: "Popup blocked"
- Allow popups in your browser for `localhost:3000`
- Chrome: Click the popup icon in address bar
- Firefox: Click "Options" → "Allow popups"

### Error: "redirect_uri_mismatch"
- Go back to Google Cloud Console → Credentials
- Edit your OAuth Client
- Make sure redirect URI is exactly: `http://localhost:3000/oauth-callback`
- No trailing slash!

### Error: "invalid_client"
- Double-check the Client ID in `.env.local`
- Make sure you copied the **Client ID**, not the **Client Secret**
- Restart your dev server after changing `.env.local`

### Error: "access_denied"
- Make sure your Google account is added as a test user
- Go to OAuth consent screen → Test users → Add your email

### Popup closes immediately
- Check browser console for errors
- Make sure `/oauth-callback` route exists in your app
- Check that `OAuthCallback.js` component is created

---

## What Happens Behind the Scenes

1. **User clicks Google button** → Opens popup to Google OAuth
2. **User logs in with Google** → Google authenticates user
3. **Google redirects** → to `http://localhost:3000/oauth-callback`
4. **Callback page** → Extracts ID token from URL
5. **Token sent to backend** → `/api/auth/external` endpoint
6. **Backend validates token** → Creates/finds user in database
7. **Returns JWT token** → Frontend stores it in localStorage
8. **User is logged in** → Redirected to home page

---

## Production Deployment

When you deploy to production (e.g., `https://cuefinder.com`):

### 1. Update Authorized Origins
In Google Cloud Console → Credentials → Edit OAuth client:
- Add: `https://cuefinder.com`

### 2. Update Authorized Redirect URIs
- Add: `https://cuefinder.com/oauth-callback`

### 3. Update Environment Variable
In production `.env`:
```env
REACT_APP_GOOGLE_CLIENT_ID=same-client-id-as-dev
```

### 4. Move to Production OAuth Consent
- Go to OAuth consent screen
- Click **PUBLISH APP**
- Submit for Google verification (optional, but recommended)

---

## Security Notes

✅ **DO:**
- Keep `.env.local` in `.gitignore`
- Use HTTPS in production
- Verify tokens on backend
- Set proper CORS headers

❌ **DON'T:**
- Commit `.env.local` to Git
- Share your Client Secret (we don't use it for web apps)
- Skip backend token validation

---

## Files Modified

✅ `LoginPage.js` - Real OAuth implementation
✅ `OAuthCallback.js` - NEW - Handles Google redirect
✅ `App.js` - Added `/oauth-callback` route
✅ `DatabaseAuthService.cs` - ExternalLoginAsync method
✅ `User.cs` - Added OAuth properties

---

## Need Help?

Check these resources:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In JavaScript Guide](https://developers.google.com/identity/sign-in/web/sign-in)
- Browser console (F12) for error messages

---

**Setup Date:** January 6, 2026
**Status:** ✅ Ready for real OAuth
**Mock Mode:** ❌ Disabled (will show error if client ID not configured)
