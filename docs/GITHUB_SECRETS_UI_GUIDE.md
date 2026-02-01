# GitHub Secrets UI Guide - Step by Step with Screenshots Description

## Getting to GitHub Secrets

### Step 1: Open Your Repository Settings

```
GitHub Repository → Settings Tab
│
└─ URL: https://github.com/YOUR_USERNAME/CueFinder/settings
```

### Step 2: Navigate to Secrets

In the left sidebar under **Security**, click:
```
Secrets and variables → Actions
```

URL: `https://github.com/YOUR_USERNAME/CueFinder/settings/secrets/actions`

## Adding Your First Secret: SMTP_PASSWORD

### Step-by-Step

1. **Click "New repository secret"** (green button, top right)

2. **Fill in the form**:
   ```
   Name field:         SMTP_PASSWORD
   Secret field:       [paste your 16-char Google app password]
   Description field:  Gmail app-specific password for SMTP
   ```

3. **Click "Add secret"** (green button, bottom right)

### What It Looks Like

```
┌─────────────────────────────────────────────────────────┐
│ New Secret                                         × [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Name *                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ SMTP_PASSWORD                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Secret *                                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ abcd efgh ijkl mnop                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Description (optional)                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Gmail app-specific password for SMTP               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌──────────────────┐     ┌──────────────────────┐      │
│ │ Cancel           │     │ Add secret (GREEN)   │      │
│ └──────────────────┘     └──────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## All Email Secrets - In Order

Add these 4 secrets, one by one:

### Secret 1: SMTP_PASSWORD

```
┌─────────────────────────────────────────┐
│ Name:        SMTP_PASSWORD              │
│ Value:       abcd efgh ijkl mnop        │
│ Description: Gmail app password         │
│ Priority:    ⭐⭐⭐⭐⭐ CRITICAL        │
└─────────────────────────────────────────┘
```

**Get this value:**
1. Open [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" + "Windows Computer"
3. Copy the generated 16-character password
4. No spaces! (if there are spaces, they're just for display - copy exact value)

### Secret 2: SMTP_SERVER

```
┌─────────────────────────────────────────┐
│ Name:        SMTP_SERVER                │
│ Value:       smtp.gmail.com             │
│ Description: SMTP server address        │
│ Priority:    ⭐⭐⭐ RECOMMENDED         │
└─────────────────────────────────────────┘
```

**Note:** This has a default, but explicit value is better for clarity.

### Secret 3: SMTP_PORT

```
┌─────────────────────────────────────────┐
│ Name:        SMTP_PORT                  │
│ Value:       587                        │
│ Description: SMTP port (TLS)            │
│ Priority:    ⭐⭐⭐ RECOMMENDED         │
└─────────────────────────────────────────┘
```

**Note:** 587 is standard for Gmail. (465 is SSL, use 587 for TLS)

### Secret 4: EMAIL_FROM

```
┌─────────────────────────────────────────┐
│ Name:        EMAIL_FROM                 │
│ Value:       cuefinderinfo@gmail.com    │
│ Description: Sender email address       │
│ Priority:    ⭐⭐⭐⭐⭐ CRITICAL        │
└─────────────────────────────────────────┘
```

**Must match:** The Gmail account where you got the app password.

## Verifying Secrets Are Added

After adding all secrets, go to:
```
Settings → Secrets and variables → Actions
```

You should see a list like:

```
┌───────────────────────────────────────┐
│ 🔍 Secrets (4)                        │
├───────────────────────────────────────┤
│                                       │
│ EMAIL_FROM                            │
│ Updated 2 minutes ago by you           │
│ [Edit]  [Delete]                      │
│                                       │
│ SMTP_PASSWORD                         │
│ Updated 2 minutes ago by you           │
│ [Edit]  [Delete]                      │
│                                       │
│ SMTP_PORT                             │
│ Updated 2 minutes ago by you           │
│ [Edit]  [Delete]                      │
│                                       │
│ SMTP_SERVER                           │
│ Updated 2 minutes ago by you           │
│ [Edit]  [Delete]                      │
│                                       │
│ [+ New repository secret]             │
│                                       │
└───────────────────────────────────────┘
```

✅ If you see all 4, you're good!

## Editing a Secret

If you need to change a secret value:

1. Click the secret name (e.g., "SMTP_PASSWORD")
2. Click **Update** button
3. Paste new value
4. Click **Save**

```
┌─────────────────────────────────────────┐
│ SMTP_PASSWORD                            │
│                                         │
│ Updated 5 minutes ago by you             │
│                                         │
│ Secret value: ••••••••••••••             │
│ (hidden for security)                    │
│                                         │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ Delete       │  │ Update       │     │
│ └──────────────┘  └──────────────┘     │
│                                         │
│ When you click Update:                   │
│ ┌──────────────────────────────────┐    │
│ │ New Secret value: [input field]   │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ Cancel       │  │ Save         │     │
│ └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

## What Happens When You Deploy

After adding secrets and pushing to `release` branch:

### In GitHub Actions UI:

```
Actions Tab → Deploy Backend [workflow name]
│
├─ Workflow Run
│  └─ Status: ✅ Passed (green)
│
├─ Click workflow to see details
│  └─ Step: "Create deployment script"
│     └─ Shows environment variables
│        (passwords masked as ***)
│
└─ Secrets automatically:
   - Read from GitHub (encrypted)
   - Injected into workflow
   - Used to create .env file
   - Deployed to server
   - Never logged in plain text
```

## Optional: Gmail API Secrets (Future)

If you want to also add Gmail API secrets now (for future use):

### Secret 5: GMAIL_CLIENT_ID

```
┌─────────────────────────────────────────┐
│ Name:        GMAIL_CLIENT_ID            │
│ Value:       1084511442650-9f54j50...   │
│ Description: Google Cloud OAuth2 ID     │
│ Priority:    ⭐⭐ OPTIONAL              │
└─────────────────────────────────────────┘
```

### Secret 6: GMAIL_CLIENT_SECRET

```
┌─────────────────────────────────────────┐
│ Name:        GMAIL_CLIENT_SECRET        │
│ Value:       GOCSPX-6gpcgJlWAFcs...    │
│ Description: Google Cloud OAuth2 Secret │
│ Priority:    ⭐⭐ OPTIONAL              │
└─────────────────────────────────────────┘
```

### Secret 7: GMAIL_PROJECT_ID

```
┌─────────────────────────────────────────┐
│ Name:        GMAIL_PROJECT_ID           │
│ Value:       cuefinder                  │
│ Description: Google Project ID          │
│ Priority:    ⭐⭐ OPTIONAL              │
└─────────────────────────────────────────┘
```

**Note:** These are optional and only needed if you plan to use Gmail API instead of SMTP.

## Testing After Deployment

### 1. Check Deployment Succeeded

```
GitHub UI → Actions Tab
  ↓
Click "Deploy Backend" workflow
  ↓
Look for green ✅ check mark
  ↓
Expand "Create deployment script" step
  ↓
Verify all env variables listed (passwords masked)
```

### 2. Test on Production

```bash
# SSH to server
ssh user@billiardscuefinder.com

# Check .env file has secrets
cat /home/cuefinder/app/.env | grep SMTP

# Output should show:
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=cuefinderinfo@gmail.com
```

### 3. Test Email Functionality

Go to: `https://billiardscuefinder.com/login`
1. Click "Forgot Password"
2. Enter test email
3. Check inbox
4. Look for email from `cuefinderinfo@gmail.com`

## Troubleshooting

### Problem: Secrets Don't Appear in List

```
Possible Causes:
┌─────────────────────────────────────┐
│ ❌ Not in correct location           │
│    Go: Settings → Secrets → Actions  │
│                                     │
│ ❌ Secrets hidden (normal behavior)  │
│    Actual values never shown in UI   │
│    Just refresh page                 │
│                                     │
│ ❌ Browser cache issue               │
│    Hard refresh: Ctrl+Shift+R        │
└─────────────────────────────────────┘
```

### Problem: Secret Name Wrong

```
❌ Wrong:  smtp-password     (lowercase, hyphens)
✅ Correct: SMTP_PASSWORD    (uppercase, underscores)

Reason: GitHub secret names are case-sensitive
        Workflow uses exact name matching
```

### Problem: "Invalid app password"

```
Solution:
1. Go to myaccount.google.com/apppasswords
2. Check password wasn't revoked
3. Generate NEW password (old ones expire)
4. Copy carefully (no leading/trailing spaces)
5. Update SMTP_PASSWORD secret
6. Re-deploy
```

## Quick Reference

| Step | Where | What |
|------|-------|------|
| 1 | GitHub UI | Settings → Secrets and variables → Actions |
| 2 | GitHub | Click "New repository secret" (green) |
| 3 | Google | Generate app password from myaccount.google.com |
| 4 | GitHub | Add SMTP_PASSWORD secret |
| 5 | GitHub | Add SMTP_SERVER secret |
| 6 | GitHub | Add SMTP_PORT secret |
| 7 | GitHub | Add EMAIL_FROM secret |
| 8 | Terminal | `git push origin release` |
| 9 | GitHub | Watch Actions deploy |
| 10 | Browser | Test at billiardscuefinder.com/forgot-password |

## Common Questions

**Q: What if I type secret wrong?**
A: Delete the secret, create new one with correct value.

**Q: Can I see the secret value?**
A: No - GitHub hides it. That's the security feature.

**Q: How often do I need to rotate?**
A: Gmail app passwords: Every 90 days. See [MANAGE_SECRETS.md](MANAGE_SECRETS.md).

**Q: What if secret is compromised?**
A: Delete immediately, generate new, update GitHub, redeploy.

**Q: Do I need all 4 secrets?**
A: Yes, at minimum: SMTP_PASSWORD, EMAIL_FROM. 
   Others (SMTP_SERVER, SMTP_PORT) have defaults but explicit is better.

---

**Need more help?**
- Full guide: [GITHUB_SECRETS_SETUP_GUIDE.md](GITHUB_SECRETS_SETUP_GUIDE.md)
- Quick setup: [GITHUB_SECRETS_QUICK_SETUP.md](GITHUB_SECRETS_QUICK_SETUP.md)
- Architecture: [GITHUB_SECRETS_ARCHITECTURE.md](GITHUB_SECRETS_ARCHITECTURE.md)
