# Quick Setup: GitHub Secrets for Email in Production

## 5-Minute Setup

### 1. Go to GitHub Repository
```
https://github.com/YOUR_USERNAME/CueFinder
→ Settings → Secrets and variables → Actions
```

### 2. Create Gmail App Password
1. Open [Google Account](https://myaccount.google.com/)
2. Click **Security** (left menu)
3. Scroll to **App passwords** (if you have 2FA enabled)
4. Select: **Mail** + **Windows Computer**
5. Copy the 16-character password

### 3. Add These Secrets to GitHub

**Minimal Setup (SMTP - Just Add These):**

```
Name: SMTP_PASSWORD
Value: [paste 16-char Google app password]

Name: EMAIL_FROM
Value: cuefinderinfo@gmail.com

Name: SMTP_SERVER
Value: smtp.gmail.com

Name: SMTP_PORT
Value: 587
```

**Optional (Gmail API - Can Add Later):**

```
Name: GMAIL_CLIENT_ID
Value: [YOUR_GMAIL_CLIENT_ID]

Name: GMAIL_CLIENT_SECRET
Value: [YOUR_GMAIL_CLIENT_SECRET]

Name: GMAIL_PROJECT_ID
Value: cuefinder
```

### 4. Done! 
Your secrets are now available to the deployment pipeline.

---

## How It Works in Deployment

```
GitHub Actions triggered (push to release branch)
    ↓
Reads secrets from GitHub (encrypted)
    ↓
Creates .env file with secrets
    ↓
Deploys to production server
    ↓
Docker-compose loads .env
    ↓
Backend container gets email config
    ↓
Password reset emails work! ✅
```

---

## Verification

After deployment, test password reset:

```bash
curl -X POST https://billiardscuefinder.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test@example.com"}'
```

Check logs:
```bash
ssh user@server
docker logs cuefinder-backend-prod | tail -20
```

---

## Troubleshooting

**Email not sending?**
- Check if `SMTP_PASSWORD` secret is set
- Verify Gmail app password wasn't revoked
- Check server logs: `docker logs cuefinder-backend-prod | grep -i email`

**Need to rotate password?**
1. Generate new Gmail app password
2. Update `SMTP_PASSWORD` secret in GitHub
3. Trigger deployment (next push or manual)

**Need to check what's deployed?**
```bash
ssh user@server
cat /home/cuefinder/app/.env | grep SMTP
```

---

## Reference
- Full Guide: [GITHUB_SECRETS_SETUP_GUIDE.md](GITHUB_SECRETS_SETUP_GUIDE.md)
- Gmail API Guide: [GMAIL_API_SETUP_GUIDE.md](GMAIL_API_SETUP_GUIDE.md)
- Workflow File: [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml)
