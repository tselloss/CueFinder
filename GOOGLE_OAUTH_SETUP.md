# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for CueFinder.

## Prerequisites

- A Google Cloud Platform account
- Access to the CueFinder repository

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or **Internal** if for organization only)
3. Fill in the required information:
   - **App name**: CueFinder
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (if in testing mode):
   - Add your email addresses
6. Save and continue

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure settings:
   - **Name**: CueFinder Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://billiardscuefinder.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/oauth-callback` (development)
     - `https://billiardscuefinder.com/oauth-callback` (production)
5. Click **Create**
6. **IMPORTANT**: Copy your **Client ID** and **Client Secret**

## Step 5: Configure Frontend (Development)

1. Navigate to `CueFinderFE/packages/app/`
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Edit `.env.local` and add your Google Client ID:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

## Step 6: Configure Backend (Development)

1. Edit `CueFinderBE/appsettings.Development.json`
2. Update the GoogleOAuth section:
   ```json
   "GoogleOAuth": {
     "ClientId": "your-client-id-here.apps.googleusercontent.com",
     "ClientSecret": "your-client-secret-here",
     "RedirectUri": "http://localhost:3000/oauth-callback"
   }
   ```

## Step 7: Configure Production Environment

### Frontend (Production)

Set the environment variable in your production environment:
```bash
REACT_APP_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
```

### Backend (Production)

Update your existing GitHub secrets (already configured):
```bash
GMAIL_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-production-client-secret
```

The same Google credentials are used for both Gmail API and OAuth login.

## Step 8: Test Google OAuth

1. Start your development environment:
   ```bash
   docker-compose up -d
   ```
2. Navigate to http://localhost:3000/login
3. Click "Continue with Google"
4. You should see the Google OAuth consent screen
5. Sign in with your Google account
6. You should be redirected back to CueFinder and logged in

## Troubleshooting

### "redirect_uri_mismatch" Error

- Ensure your redirect URI in Google Cloud Console exactly matches what's configured in your app
- Check for trailing slashes (they matter!)
- Verify you're using the correct protocol (http vs https)

### "invalid_client" Error

- Double-check your Client ID and Client Secret
- Ensure they're correctly set in your environment variables
- Verify you're using the correct credentials for your environment (dev vs prod)

### Popup Blocked

- Check browser popup blocker settings
- Ensure your browser allows popups for localhost (development) or your domain (production)

### Token Validation Failed

- Verify the token is being correctly extracted from the OAuth callback
- Check backend logs for detailed error messages
- Ensure your Client ID matches between frontend and backend

## Security Best Practices

1. **Never commit credentials**: Keep your Client Secret in environment variables only
2. **Use different credentials**: Use separate OAuth clients for development and production
3. **Restrict domains**: Only add trusted domains to authorized origins
4. **Rotate secrets**: Periodically rotate your Client Secret
5. **Monitor usage**: Regularly check Google Cloud Console for suspicious activity

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Debugger](https://oauthdebugger.com/)

## Support

For issues related to Google OAuth setup, check:
1. Google Cloud Console error logs
2. Browser developer console
3. CueFinder backend logs
4. CueFinder GitHub issues
