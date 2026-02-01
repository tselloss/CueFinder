# Email Secrets Checklist - Copy & Paste Ready

## Before You Start
1. Open GitHub repo → Settings → Secrets and variables → Actions
2. Have [Google Account](https://myaccount.google.com/) open in another tab
3. Have your Gmail credentials ready

## Step 1: Generate Gmail App Password (if you have 2FA enabled)

[Google Account Security Page](https://myaccount.google.com/security)

1. Click **App passwords** (requires 2FA enabled)
2. Select: **Mail** + **Windows Computer**
3. Google generates 16-character password: `abcd efgh ijkl mnop`
4. Copy this password

If you don't see "App passwords":
- Go to [myaccount.google.com/u/0/security](https://myaccount.google.com/u/0/security)
- Enable "2-Step Verification" first
- Then app passwords will appear

## Step 2: Add Email Secrets to GitHub

### Secret #1: SMTP Password
```
Name: SMTP_PASSWORD
Value: abcd efgh ijkl mnop
Description: Gmail app-specific password for SMTP authentication
```

### Secret #2: SMTP Server
```
Name: SMTP_SERVER
Value: smtp.gmail.com
Description: SMTP server address
```

### Secret #3: SMTP Port
```
Name: SMTP_PORT
Value: 587
Description: SMTP port (TLS)
```

### Secret #4: Email From Address
```
Name: EMAIL_FROM
Value: cuefinderinfo@gmail.com
Description: Sender email address for password reset emails
```

## Step 3: Optional - Add Gmail API Secrets

(Only if you plan to use Gmail API instead of SMTP)

### Secret #5: Gmail Client ID
```
Name: GMAIL_CLIENT_ID
Value: 1084511442650-9f54j50i7r955pafbou5t8d0qcid87td.apps.googleusercontent.com
Description: Google Cloud OAuth2 Client ID
```

### Secret #6: Gmail Client Secret
```
Name: GMAIL_CLIENT_SECRET
Value: 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
Description: Google Cloud OAuth2 Client Secret
```

### Secret #7: Gmail Project ID
```
Name: GMAIL_PROJECT_ID
Value: cuefinder
Description: Google Cloud Project ID
```

## Step 4: Verify All Secrets Are Set

In GitHub Settings → Secrets and variables → Actions, you should see:

```
SMTP_PASSWORD           ✅ (hidden)
SMTP_SERVER             ✅ smtp.gmail.com
SMTP_PORT               ✅ 587
EMAIL_FROM              ✅ cuefinderinfo@gmail.com
GMAIL_CLIENT_ID         ⚠️  (optional)
GMAIL_CLIENT_SECRET     ⚠️  (optional)
GMAIL_PROJECT_ID        ⚠️  (optional)
[plus existing secrets]
```

## Step 5: Test Deployment

1. Make a small change to backend code
2. Push to `release` branch
3. Go to **Actions** tab
4. Wait for **Deploy Backend** workflow
5. Check logs for "Email sent" confirmation

## Step 6: Test Email Sending

```bash
# SSH to production server
ssh user@billiardscuefinder.com

# Check .env has secrets
cat /home/cuefinder/app/.env | grep SMTP

# Should output:
# SMTP_PASSWORD=abcd efgh ijkl mnop
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# EMAIL_FROM=cuefinderinfo@gmail.com

# Check container logs
docker logs cuefinder-backend-prod | tail -20

# Should show no email errors
```

## Step 7: User Tests Password Reset

1. Open https://billiardscuefinder.com/login
2. Click "Forgot Password"
3. Enter email
4. Check email inbox
5. Should receive reset link from `cuefinderinfo@gmail.com`

## Troubleshooting

### "Email service is not configured"
→ SMTP_PASSWORD secret not set or deployment not run yet

### "Email sent successfully" but user doesn't receive
→ Gmail filtering/spam
  - Check spam folder
  - Check if app password was revoked

### "Invalid app password"
→ Secrets don't match
  - Verify you copied full 16-character password
  - No spaces before/after
  - Check for typos

### Still not working?
```bash
# Check error logs
docker logs cuefinder-backend-prod | grep -i "email\|smtp\|error"

# Check container has environment
docker exec cuefinder-backend-prod env | grep -i smtp

# Check .env file permissions
ls -la /home/cuefinder/app/.env
# Should be: -rw------- (only owner can read)
```

## Security Notes

⚠️ **Important**:
- Never share app passwords in chat/email
- Never commit secrets to GitHub
- Rotate app password every 90 days
- Keep `GMAIL_CLIENT_SECRET` private

✅ **What GitHub Secrets Does**:
- Encrypts at rest
- Masks in logs
- Restricts access
- Provides audit trail

## Quick Reference

| Secret | For What | When Needed |
|--------|----------|------------|
| SMTP_PASSWORD | SMTP auth | Always (for email) |
| SMTP_SERVER | SMTP host | Always (default: smtp.gmail.com) |
| SMTP_PORT | SMTP port | Always (default: 587) |
| EMAIL_FROM | Sender | Always |
| GMAIL_CLIENT_ID | Gmail API | Optional (future) |
| GMAIL_CLIENT_SECRET | Gmail API | Optional (future) |
| GMAIL_PROJECT_ID | Gmail API | Optional (future) |

---

**Need Help?**
- Secrets Guide: [GITHUB_SECRETS_SETUP_GUIDE.md](GITHUB_SECRETS_SETUP_GUIDE.md)
- Architecture: [GITHUB_SECRETS_ARCHITECTURE.md](GITHUB_SECRETS_ARCHITECTURE.md)
- Quick Setup: [GITHUB_SECRETS_QUICK_SETUP.md](GITHUB_SECRETS_QUICK_SETUP.md)
