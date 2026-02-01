# Managing & Rotating Secrets in Production

## Overview

This guide explains how to manage GitHub Secrets throughout the lifecycle of your production deployment, including adding, updating, and rotating secrets.

## Managing Secrets in GitHub UI

### Adding a New Secret

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Fill in:
   - **Name**: `SECRET_NAME` (all caps, underscore separated)
   - **Value**: Paste the actual secret value
   - **Description** (optional): What this secret is for
4. Click **Add secret**

### Updating an Existing Secret

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Find the secret in the list
3. Click the secret name
4. Click **Update**
5. Paste new value
6. Click **Save**

### Deleting a Secret

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Find the secret
3. Click it
4. Click **Delete**
5. Confirm deletion

### Viewing Secret History

Secrets don't show history in UI, but you can:

1. Go to: **Settings** → **Audit log**
2. Filter by "org.secretsManager"
3. See who accessed/updated secrets
4. Timestamps of changes

## Common Secret Rotation Scenarios

### Scenario 1: Gmail App Password Expires

**Symptoms**:
- Email sending fails after 90 days
- Error: "Invalid app password"
- Logs: "SMTP authentication failed"

**How to Fix**:

1. **Generate New Password**:
   - Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
   - Select: **Mail** + **Windows Computer**
   - Copy new 16-character password

2. **Update GitHub Secret**:
   - Settings → Secrets → `SMTP_PASSWORD`
   - Click **Update**
   - Paste new password
   - Click **Save**

3. **Trigger Deployment**:
   ```bash
   # Option 1: Push to release branch (any change)
   git push origin release
   
   # Option 2: Manual trigger
   # GitHub UI → Actions → Deploy Backend → Run workflow
   ```

4. **Verify**:
   ```bash
   ssh user@server
   cat /home/cuefinder/app/.env | grep SMTP_PASSWORD
   # Should show new password
   ```

5. **Test Email**:
   - Go to https://billiardscuefinder.com/forgot-password
   - Submit email
   - Check inbox for reset email

### Scenario 2: Database Password Compromise

**Symptoms**:
- Suspicious database activity
- Need to reset due to security incident

**How to Fix**:

1. **Generate New Password**:
   - Create strong password (min 32 chars)
   - `MyNewPa$$w0rd_2025_GeneratedSecure!`

2. **Update Database**:
   ```bash
   # On production server
   ssh user@server
   
   # Connect to PostgreSQL
   docker exec cuefinder-postgres-prod \
     psql -U postgres -d cuefinder \
     -c "ALTER USER postgres WITH PASSWORD 'MyNewPa$$w0rd_2025_GeneratedSecure!';"
   ```

3. **Update GitHub Secret**:
   - Settings → Secrets → `DB_PASSWORD`
   - Click **Update**
   - Paste new password
   - Click **Save**

4. **Trigger Deployment**:
   ```bash
   git push origin release
   ```

5. **Verify Connection**:
   ```bash
   # Check logs
   docker logs cuefinder-backend-prod
   # Should show successful database connection
   ```

### Scenario 3: JWT Secret Compromise

**Symptoms**:
- Invalid JWT tokens in logs
- Security incident requiring secret rotation
- Need to invalidate existing sessions

**How to Fix**:

1. **Generate New Secret**:
   ```bash
   # On any machine with OpenSSL
   openssl rand -base64 64
   # Output: 1a2b3c4d5e6f7g8h9i0j...
   ```

2. **Update GitHub Secret**:
   - Settings → Secrets → `JWT_SECRET`
   - Click **Update**
   - Paste new secret
   - Click **Save**

3. **Trigger Deployment**:
   ```bash
   git push origin release
   ```

4. **Effect**:
   - All existing JWT tokens become invalid
   - Users must log in again
   - This is expected security behavior

## Scheduled Secret Rotation

### Recommended Rotation Schedule

```
Every 30 days:
  ✅ SMTP_PASSWORD        (Gmail app password may expire)
  ✅ GMAIL_CLIENT_SECRET  (if using Gmail API)

Every 90 days:
  ✅ JWT_SECRET           (prevent token hijacking)
  ✅ DB_PASSWORD          (security best practice)

As needed:
  ✅ SSH_PRIVATE_KEY      (if compromised)
  ✅ API_KEYS             (if exposed)
```

### Setting Up Rotation Reminders

**Option 1: GitHub Issues**
```bash
# Create issue for reminder
gh issue create \
  --title "Rotate secrets - JWT and DB passwords" \
  --body "Scheduled rotation: Due by [DATE]" \
  --label "security,maintenance"
```

**Option 2: Calendar Reminder**
- Set recurring calendar event
- 1st of each month: "Rotate SMTP secrets"
- 1st of quarter: "Rotate database credentials"

**Option 3: Automated (Future)**
- Use GitHub Actions to create automatic issue
- Or: Integrate with secrets management service (Azure Key Vault, etc.)

## Secrets Best Practices

### DO's ✅

- [ ] Store ALL sensitive data in GitHub Secrets
- [ ] Rotate secrets every 30-90 days
- [ ] Use strong, random passwords (32+ chars)
- [ ] Include timestamps in secret values (if safe to do)
- [ ] Document what each secret is for
- [ ] Keep SSH keys rotated
- [ ] Use environment-specific secrets
- [ ] Enable 2FA on all accounts
- [ ] Audit log access regularly
- [ ] Use secret descriptions

### DON'Ts ❌

- [ ] Never hardcode secrets in code
- [ ] Never log sensitive values
- [ ] Never share secrets via email/chat
- [ ] Never reuse secrets across projects
- [ ] Never commit .env files to git
- [ ] Never screenshot secrets
- [ ] Never use predictable passwords
- [ ] Never ignore security warnings
- [ ] Never skip secret rotation
- [ ] Never share GitHub access

## Auditing Secret Access

### Check Who Accessed Secrets

```bash
# Go to: Settings → Audit log
# Filter by: "secretsManager"
# Look for:
  - "access_secret"
  - "update_secret"
  - "create_secret"
  - "delete_secret"
```

### Sample Audit Events

```
2025-01-29  user@example.com  actions_secretsManager access_secret  SMTP_PASSWORD
2025-01-28  github-actions    actions_secretsManager access_secret  DB_PASSWORD
2025-01-27  user@example.com  actions_secretsManager update_secret  JWT_SECRET
```

## Emergency Secret Revocation

### If Secret is Compromised Immediately:

1. **Stop All Deployments**:
   ```bash
   # Cancel in-progress Actions workflow
   # GitHub UI → Actions → [workflow] → Cancel workflow run
   ```

2. **Delete Compromised Secret**:
   - Settings → Secrets → [secret name]
   - Click **Delete**
   - Confirm

3. **Invalidate Old Credentials**:
   ```bash
   # For DB: Change password in database
   # For JWT: Rotate secret (invalidates all tokens)
   # For SMTP: Revoke Google app password
   ```

4. **Generate New Secret**:
   - Follow procedure for that secret type
   - Generate new strong credentials

5. **Add New Secret to GitHub**:
   - Settings → Secrets → New repository secret
   - Name: same as before
   - Value: new credentials

6. **Deploy Immediately**:
   ```bash
   git push origin release
   # This deploys new secret to production
   ```

7. **Monitor Logs**:
   ```bash
   docker logs cuefinder-backend-prod
   # Watch for successful connections with new credentials
   ```

8. **Notify Team**:
   - Alert team of compromise
   - Document what happened
   - Update security policies

## Secret Lifecycle Diagram

```
Secret Created
    ↓
Set in GitHub Secrets (encrypted)
    ↓
Used in Deployment (GitHub Actions)
    ↓
Deployed to Server (in .env)
    ↓
Loaded by Application (runtime config)
    ↓
Actively Used (SMTP, JWT, DB, etc.)
    ↓
[30-90 days pass]
    ↓
Time to Rotate
    ↓
Generate New Secret
    ↓
Update GitHub Secret
    ↓
Trigger Deployment
    ↓
New Secret in Production
    ↓
Old Secret Still Works (grace period: optional)
    ↓
[Monitor logs]
    ↓
Disable/Revoke Old Secret
    ↓
Back to: Actively Used (with new secret)
```

## Troubleshooting Secret Issues

### Problem: Deployment Fails After Secret Update

**Symptoms**:
- Deployment fails
- Container won't start
- Logs show authentication error

**Solution**:
1. Check secret value has no spaces/typos
2. Verify secret was actually saved
3. Verify deployment script accesses it correctly
4. Check `.env` file on server: `cat /home/cuefinder/app/.env | grep [SECRET]`
5. Rollback to previous secret if needed

### Problem: Old Secret Still Being Used

**Symptoms**:
- Application ignores new secret
- Logs show old behavior

**Solution**:
1. Force new deployment: `git push origin release`
2. Check container has new environment: `docker ps` and verify restart time
3. Verify `.env` updated: `cat /home/cuefinder/app/.env`
4. Restart container if needed: `docker restart cuefinder-backend-prod`

### Problem: Can't Remember What Each Secret Does

**Solution**:
- Use GitHub secret descriptions (when creating)
- Keep documentation: See [GITHUB_SECRETS_SETUP_GUIDE.md](GITHUB_SECRETS_SETUP_GUIDE.md)
- Document in team wiki or README
- Add comments to deployment workflow

## Commands Reference

```bash
# Check current secrets in .env (on server)
ssh user@server "cat /home/cuefinder/app/.env"

# Check container environment
docker exec cuefinder-backend-prod env | grep -i smtp

# Search logs for secret-related errors
docker logs cuefinder-backend-prod | grep -i "auth\|password\|error"

# View deployment workflow file
cat .github/workflows/deploy-backend.yml

# Generate strong random password
openssl rand -base64 32

# Check when secret was last used
# Go to: GitHub → Settings → Audit log → Filter by secret name
```

## Integration with Secrets Management Services

### For Future Consideration:

- **Azure Key Vault**: Manage secrets centrally
- **AWS Secrets Manager**: AWS-based secret storage
- **HashiCorp Vault**: Enterprise secret management
- **1Password Teams**: Team password management

These can integrate with GitHub Actions for automatic secret rotation.

## Support & Documentation

- [GitHub Secrets Docs](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Setup Guide](GITHUB_SECRETS_SETUP_GUIDE.md)
- [Quick Setup](GITHUB_SECRETS_QUICK_SETUP.md)
- [Architecture Diagram](GITHUB_SECRETS_ARCHITECTURE.md)
- [Email Secrets Checklist](EMAIL_SECRETS_CHECKLIST.md)
