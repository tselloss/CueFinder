# Gmail API Email Integration Guide

## Overview
CueFinder now supports email sending via Gmail API as an alternative to SMTP. This guide explains how to configure and use the Gmail API credentials you created.

## Your OAuth2 Credentials

You've created a Google Cloud project with the following OAuth2 configuration:
- **Project ID**: `cuefinder`
- **Client ID**: `1084511442650-9f54j50i7r955pafbou5t8d0qcid87td.apps.googleusercontent.com`
- **Client Secret**: `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`

## Setup Steps

### 1. Enable Gmail API
Visit [Google Cloud Console](https://console.cloud.google.com/):
1. Select your `cuefinder` project
2. Go to **APIs & Services** > **Library**
3. Search for "Gmail API"
4. Click it and press **Enable**

### 2. Set Up OAuth Consent Screen
1. In Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in the application details:
   - **App name**: CueFinder
   - **User support email**: cuefinderinfo@gmail.com
   - **Developer contact**: your-email@gmail.com
4. Click **Save and Continue**
5. On **Scopes** page, add: `https://www.googleapis.com/auth/gmail.send`
6. Complete the setup

### 3. Configure Backend Settings

#### Option A: SMTP (Simpler - Current Default)
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "FromEmail": "cuefinderinfo@gmail.com",
    "FromName": "CueFinder",
    "SmtpPassword": "your-app-specific-password",
    "EnableSsl": true
  },
  "GmailApi": {
    "Enabled": false
  }
}
```

**To get Gmail app password**:
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App passwords** (appears after 2FA is enabled)
4. Select **Mail** and **Windows Computer**
5. Google generates a 16-character password
6. Use this as `SmtpPassword`

#### Option B: Gmail API (More Secure - Requires Additional Setup)
```json
{
  "GmailApi": {
    "Enabled": true,
    "ClientId": "1084511442650-9f54j50i7r955pafbou5t8d0qcid87td.apps.googleusercontent.com",
    "ClientSecret": "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",
    "ProjectId": "cuefinder",
    "FromEmail": "cuefinderinfo@gmail.com",
    "FromName": "CueFinder",
    "TokenPath": "gmail_token.json"
  }
}
```

### 4. Environment Variables (Recommended for Production)
Instead of storing secrets in config files, use environment variables:

```bash
# SMTP Method
export EMAIL_SMTPPASSWORD="your-app-specific-password"

# Gmail API Method  
export GMAILAPI_CLIENTSECRET="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"
```

## Implementation Status

### Current Implementation
- ✅ SMTP Email Service (working - using System.Net.Mail)
- ✅ Gmail API Settings structure
- ✅ Gmail API Email Service skeleton
- ✅ Service registration with conditional loading
- ✅ Password reset email integration

### TODO for Complete Gmail API Support
The Gmail API service needs the following NuGet package:
```xml
<PackageReference Include="Google.Apis.Gmail.v1" Version="1.68.0.3556" />
```

Complete implementation requires:
1. Install NuGet package in `CueFinder.Extensions.csproj`
2. Implement `GetGmailService()` method using OAuth2 flow
3. Handle token refresh and storage
4. Complete the `SendAsync()` implementation to use Gmail API

## Recommendation

**For now, use SMTP** (Option A):
- ✅ Simpler to implement and maintain
- ✅ Works immediately after app password setup
- ✅ No additional package dependencies
- ✅ All password reset emails already wired

When you're ready for Gmail API:
1. Install the package
2. Implement OAuth token handling
3. Uncomment/complete the TODO sections in `GmailApiEmailService`

## Testing

### SMTP (Current)
Password reset emails will work immediately with valid app password:

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"testuser@example.com"}'
```

### Gmail API (When Implemented)
Same endpoint - backend automatically uses Gmail API if enabled.

## File Locations
- Settings: [CueFinderBE/appsettings.json](../CueFinderBE/appsettings.json)
- SMTP Service: [SolutionLibraries/CueFinder.Extensions/Email/EmailService.cs](../SolutionLibraries/CueFinder.Extensions/Email/EmailService.cs)
- Gmail API Service: [SolutionLibraries/CueFinder.Extensions/Email/GmailApiEmailService.cs](../SolutionLibraries/CueFinder.Extensions/Email/GmailApiEmailService.cs)
- Password Reset: [SolutionLibraries/CueFinder.Auth/Controllers/AuthController.cs](../SolutionLibraries/CueFinder.Auth/Controllers/AuthController.cs)

## Security Notes
⚠️ **Never commit secrets to version control**
- Store all credentials in environment variables
- Use secure vaults (Azure Key Vault, AWS Secrets Manager, etc.) in production
- The `client_secret_*.json` file should be added to `.gitignore`

## Support
For issues with Gmail API, refer to:
- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [OAuth2 Flow Guide](https://developers.google.com/identity/protocols/oauth2)
