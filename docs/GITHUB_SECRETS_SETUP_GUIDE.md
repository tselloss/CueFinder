# GitHub Secrets Configuration Guide for Production

## Overview
This guide explains how to set up GitHub Secrets for production deployment of CueFinder, including email configuration (SMTP and Gmail API).

## Why Use GitHub Secrets?
- ✅ Encrypted storage for sensitive data
- ✅ Automatic redaction in logs
- ✅ Per-environment configuration
- ✅ Easy secret rotation
- ✅ Audit trail of access

## Step 1: Access Repository Secrets

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/CueFinder`
2. Click **Settings** (top right)
3. In left sidebar: **Secrets and variables** > **Actions**
4. Click **New repository secret**

## Step 2: Required Secrets for Email

### Email Service Secrets (SMTP)

Add these secrets for standard SMTP email:

| Secret Name | Example Value | Description |
|---|---|---|
| `SMTP_PASSWORD` | `abcd efgh ijkl mnop` | Gmail app-specific password (16 characters) |
| `SMTP_SERVER` | `smtp.gmail.com` | SMTP server (optional, defaults to smtp.gmail.com) |
| `SMTP_PORT` | `587` | SMTP port (optional, defaults to 587) |
| `EMAIL_FROM` | `cuefinderinfo@gmail.com` | Sender email address |

### Gmail API Secrets (Optional - for Gmail API method)

Add these for OAuth2-based Gmail API sending:

| Secret Name | Example Value | Description |
|---|---|---|
| `GMAIL_CLIENT_ID` | `1084511442650-9f54j50i7r955pafbou5t8d0qcid87td.apps.googleusercontent.com` | From Google Cloud Console |
| `GMAIL_CLIENT_SECRET` | `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` | From Google Cloud Console |
| `GMAIL_PROJECT_ID` | `cuefinder` | Google Project ID |

### Existing Secrets (Already Set)
Make sure you also have these:

| Secret Name | Description |
|---|---|
| `SERVER_IP` | Production server IP address |
| `SSH_PRIVATE_KEY` | SSH private key for server access |
| `DB_PASSWORD` | PostgreSQL database password |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_API_URL` | Backend API URL for frontend |
| `CORS_FRONTEND_ORIGIN` | Frontend domain for CORS |

## Step 3: Get Gmail App Password

### For SMTP Method (Recommended Now):

1. **Enable 2-Step Verification** on your Google account:
   - Go to [Google Account](https://myaccount.google.com/)
   - Click **Security** (left sidebar)
   - Enable **2-Step Verification** (if not already enabled)

2. **Generate App Password**:
   - Go to [App passwords](https://myaccount.google.com/apppasswords)
   - Select: **Mail** and **Windows Computer**
   - Google generates a 16-character password
   - Copy this password

3. **Add to GitHub Secrets**:
   - Secret name: `SMTP_PASSWORD`
   - Secret value: `abcd efgh ijkl mnop` (the generated password)

### For Gmail API Method (Optional):

Already configured - your OAuth credentials are in appsettings.

## Step 4: Set Environment Variables in .env File

When the pipeline deploys, it creates an `.env` file on the server with all secrets:

```bash
# On production server after deployment:
cat /home/cuefinder/app/.env

# Output will include:
DB_PASSWORD=***
JWT_SECRET=***
SMTP_PASSWORD=***
GMAIL_CLIENT_SECRET=***
(and others)
```

## Step 5: How Secrets Flow Through Pipeline

### Workflow Execution:
```
1. GitHub Actions triggered (push to release branch)
   ↓
2. Secrets injected as environment variables
   ↓
3. deploy-backend.yml creates .env file with secrets
   ↓
4. SSH deployment script transfers .env to server
   ↓
5. docker-compose.prod.yml loads from .env
   ↓
6. Backend container environment variables set
   ↓
7. Application reads configuration
```

### Configuration Hierarchy (ASP.NET Core):
```
1. appsettings.Production.json (defaults)
   ↓
2. Environment variables (from .env via docker-compose)
   ↓
3. User secrets (development only)
   ↓
4. Application runs with merged configuration
```

## Step 6: Email Configuration in Production

### Using SMTP (Current):

When secrets are set, the backend will use these for password reset emails:

```
Forgot Password Request:
1. User submits email
   ↓
2. Backend generates reset token
   ↓
3. Backend sends email via SMTP
   - Server: smtp.gmail.com (from SECRET)
   - Port: 587 (from SECRET)
   - Username: cuefinderinfo@gmail.com (from SECRET)
   - Password: app-password (from SECRET)
   ↓
4. User receives password reset link
```

### Using Gmail API (When Implemented):

```
Similar flow, but:
- Uses OAuth2 instead of password
- More secure, requires Google Cloud setup
- Requires additional NuGet package
```

## Step 7: Verify Secrets Are Set

### Check in GitHub UI:
1. Go to **Settings** > **Secrets and variables** > **Actions**
2. You should see your secrets listed (values hidden)

### Check Deployment Logs:
1. Go to **Actions** tab in GitHub
2. Click recent deployment workflow
3. Expand **Create deployment script** step
4. Verify environment variables are present (passwords redacted as `***`)

## Step 8: Test Password Reset Email

After deployment with secrets configured:

```bash
# From any client:
curl -X POST https://billiardscuefinder.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"testuser@example.com"}'

# Response: 200 OK
# User receives reset email from: cuefinderinfo@gmail.com
```

## Troubleshooting

### Email Not Sending?

1. **Check Logs**:
   ```bash
   ssh user@server
   docker logs cuefinder-backend-prod | grep -i "email\|smtp"
   ```

2. **Verify Secrets**:
   ```bash
   # Secrets should be in .env on server
   cat /home/cuefinder/app/.env | grep SMTP
   cat /home/cuefinder/app/.env | grep EMAIL
   ```

3. **Check Gmail Account**:
   - App password may have been revoked
   - Generate new app password
   - Update `SMTP_PASSWORD` secret

4. **Verify Configuration**:
   ```bash
   # Inside container
   docker exec cuefinder-backend-prod env | grep -i smtp
   ```

### Secret Not Passed to Container?

1. Check `.env` file created on server:
   ```bash
   ls -la /home/cuefinder/app/.env
   ```

2. Check docker-compose output:
   ```bash
   docker compose config | grep -i smtp
   ```

3. Verify environment variable names match `appsettings.Production.json`

## Security Best Practices

### Do's ✅
- Store all secrets in GitHub Secrets
- Rotate secrets every 90 days
- Use different secrets per environment
- Enable 2FA on Google account
- Audit logs of deployment
- Use environment variables in docker-compose

### Don'ts ❌
- Never commit secrets to version control
- Never hardcode passwords in config files
- Never share secrets in chat/email
- Never log sensitive values (GitHub auto-hides)
- Never reuse secrets across projects

## Rotating Secrets

When credentials expire or need rotation:

1. **New Gmail App Password**:
   - Go to [App passwords](https://myaccount.google.com/apppasswords)
   - Revoke old password
   - Generate new password
   - Update `SMTP_PASSWORD` secret in GitHub

2. **Update Secret**:
   - Go to **Settings** > **Secrets and variables** > **Actions**
   - Click secret name
   - Click **Update**
   - Paste new value
   - Click **Save**

3. **Trigger Deployment**:
   - Next deployment will use new secret
   - Or manually trigger: **Actions** > **Deploy Backend** > **Run workflow**

## Reference Files

- **Deployment Workflow**: [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml)
- **Production Config**: [docker-compose.prod.yml](docker-compose.prod.yml)
- **Backend Settings**: [CueFinderBE/appsettings.Production.json](CueFinderBE/appsettings.Production.json)
- **Email Service**: [SolutionLibraries/CueFinder.Extensions/Email/EmailService.cs](SolutionLibraries/CueFinder.Extensions/Email/EmailService.cs)
- **Email Settings**: [SolutionLibraries/CueFinder.Extensions/Email/EmailSettings.cs](SolutionLibraries/CueFinder.Extensions/Email/EmailSettings.cs)

## Complete Secrets Checklist

Run through this before first production deployment:

- [ ] `SERVER_IP` - Production server address
- [ ] `SSH_PRIVATE_KEY` - SSH key for server access
- [ ] `DB_PASSWORD` - PostgreSQL password
- [ ] `JWT_SECRET` - JWT signing secret (min 32 chars)
- [ ] `FRONTEND_API_URL` - API URL for frontend
- [ ] `CORS_FRONTEND_ORIGIN` - Frontend domain
- [ ] `SMTP_PASSWORD` - Gmail app password (for email)
- [ ] `SMTP_SERVER` - SMTP server (optional)
- [ ] `SMTP_PORT` - SMTP port (optional)
- [ ] `EMAIL_FROM` - Sender email address
- [ ] `GMAIL_CLIENT_ID` - Optional (for Gmail API)
- [ ] `GMAIL_CLIENT_SECRET` - Optional (for Gmail API)
- [ ] `GMAIL_PROJECT_ID` - Optional (for Gmail API)

## Support & Documentation

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [ASP.NET Configuration](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration)
- [Gmail API Setup](./GMAIL_API_SETUP_GUIDE.md)
- [Password Reset Implementation](./FORGOT_PASSWORD_IMPLEMENTATION_GUIDE.md)
