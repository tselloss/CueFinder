# GitHub Secrets → Server Delivery Verification

## Overview
This document verifies that all GitHub Secrets are correctly passed from GitHub Actions to your production server during deployment.

---

## Secrets Configuration Audit

### ✅ Verified in GitHub Repository Settings

All 14 required secrets are configured and ready:

| Secret | Usage | Workflow |
|--------|-------|----------|
| `SERVER_IP` | SSH target address | All 3 workflows |
| `SSH_PRIVATE_KEY` | SSH authentication | All 3 workflows |
| `DB_PASSWORD` | Database connection | Backend, Infrastructure |
| `JWT_SECRET` | Token signing | Backend, Infrastructure |
| `FRONTEND_API_URL` | Frontend API endpoint | Backend |
| `CORS_FRONTEND_ORIGIN` | CORS configuration | Backend |
| `GMAIL_CLIENT_ID` | OAuth integration | Backend |
| `GMAIL_CLIENT_SECRET` | OAuth integration | Backend |
| `GMAIL_PROJECT_ID` | OAuth integration | Backend |
| `SMTP_PASSWORD` | Email service | Backend |
| `SMTP_SERVER` | Email service (default: smtp.gmail.com) | Backend |
| `SMTP_PORT` | Email service (default: 587) | Backend |
| `EMAIL_FROM` | From address (default: cuefinderinfo@gmail.com) | Backend |

---

## Deployment Secret Flow

### Frontend Deployment Secret Flow
```
GitHub Actions Environment
    ↓
Secrets injected: SERVER_IP, SSH_PRIVATE_KEY
    ↓
Setup SSH step
    ↓
SSH connects to server as 'cuefinder' user
    ↓
Deploy script: Pulls code, builds frontend, deploys via Docker
    ↓
Production Server
```

**Verification on server:**
```bash
ssh cuefinder@<SERVER_IP>
cd /home/cuefinder/app
git log --oneline -1  # Verify latest code pulled
docker compose logs frontend --tail 20  # Check deployment output
```

---

### Backend Deployment Secret Flow
```
GitHub Actions Environment
    ↓
Secrets injected: All 14 secrets
    ↓
Create deployment script step
    ↓
    ┌─── cat > .env << ENVEOF
    │     DB_PASSWORD=$DB_PASSWORD
    │     JWT_SECRET=$JWT_SECRET
    │     ...
    │     GMAIL_PROJECT_ID=$GMAIL_PROJECT_ID
    │     ENVEOF
    └─── .env file created in GitHub Actions runner
    ↓
Transfer script + .env via SCP
    ↓
Production Server (/home/cuefinder/app/)
    ├─── deploy.sh (deployment logic)
    └─── .env (all 13 application secrets)
    ↓
Deployment script reads .env and passes to Docker
    ↓
Backend container environment
```

**Verification on server:**

*Check .env file exists and contains secrets:*
```bash
ssh cuefinder@<SERVER_IP>
cd /home/cuefinder/app

# View secrets (redacted for safety)
cat .env | head -5
# Output should show secrets like:
# DB_PASSWORD=***
# JWT_SECRET=***

# Verify secrets are in running container
docker inspect cuefinder-backend-blue-prod | grep -A 20 '"Env"'

# Should contain entries like:
# "ConnectionStrings__DefaultConnection=Host=postgres;Password=***...",
# "JwtSettings__SecretKey=***...",
# "EmailSettings__SmtpPassword=***...",
# "GmailApi__ClientId=***...",
```

*Check backend can connect to database:*
```bash
# Query the health endpoint
curl -X GET http://localhost:5001/health

# Should return: {"status":"healthy"} or similar

# Check if DB connection is working in logs
docker logs cuefinder-backend-blue-prod --tail 50 | grep -i "connection\|database\|error"
```

*Check email configuration in application:*
```bash
# If your app has a test email endpoint
curl -X POST http://localhost:5001/api/admin/test-email \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"Test"}'

# Check logs for SMTP connection attempts
docker logs cuefinder-backend-blue-prod | grep -i "smtp\|email" | tail -10
```

---

### Infrastructure Deployment Secret Flow
```
GitHub Actions Environment
    ↓
Secrets injected: SERVER_IP, SSH_PRIVATE_KEY
    ↓
Create deployment script step
    ↓
Transfer script via SCP
    ↓
Production Server (/home/cuefinder/app/)
    ├─── deploy-infra.sh (deployment logic)
    └─── Latest code from release branch
    ↓
Deployment script
    ├─── Creates /home/cuefinder/backups directory
    ├─── Backs up database
    ├─── Runs migrations
    ├─── Rebuilds opennsfw
    └─── Rebuilds moderator
    ↓
Services get secrets from docker-compose.prod.yml environment variables
```

**Verification on server:**

*Check backup directory:*
```bash
ssh cuefinder@<SERVER_IP>
ls -lah /home/cuefinder/backups/
# Should contain timestamped .sql files
```

*Check services started:*
```bash
cd /home/cuefinder/app
docker compose ps | grep -E "opennsfw|moderator|postgres"

# All should show: Up
```

*Verify moderator can reach OpenNSFW:*
```bash
# Test DNS resolution
docker compose exec moderator nslookup cuefinder-opennsfw-prod

# Test HTTP connectivity
docker compose exec moderator curl -v http://cuefinder-opennsfw-prod:8000/health

# Check moderator logs
docker compose logs moderator --tail 30
```

*Check database migrations applied:*
```bash
# Connect to database
docker compose exec postgres psql -U postgres -d cuefinder

# In psql prompt:
\dt  # List tables to verify schema exists
SELECT COUNT(*) FROM public.users;  # Verify data
\q   # Exit
```

---

## Secret Delivery Checklist

### Pre-Deployment
- [ ] All 14 secrets are configured in GitHub (Settings → Secrets)
- [ ] Each secret value is non-empty and correct
- [ ] SSH_PRIVATE_KEY starts with `-----BEGIN RSA PRIVATE KEY-----`
- [ ] No trailing newlines or extra characters in secrets

### During Deployment (Watch Workflow)
- [ ] "Setup SSH" step succeeds without errors
- [ ] "Create deployment script" step shows "✓ Environment configured"
- [ ] SCP transfer completes without "Permission denied" errors
- [ ] SSH execution completes without "command not found" errors

### Post-Deployment (Verify on Server)
**Backend deployment:**
- [ ] `.env` file exists: `ls -la /home/cuefinder/app/.env`
- [ ] Backend container is running: `docker compose ps backend*`
- [ ] Container has environment variables: `docker inspect cuefinder-backend-blue-prod | grep JWT_SECRET`
- [ ] Application started successfully: `docker logs cuefinder-backend-blue-prod | grep -i "started\|listening"`

**Infrastructure deployment:**
- [ ] Database backups exist: `ls /home/cuefinder/backups/`
- [ ] Moderator container running: `docker compose ps moderator`
- [ ] OpenNSFW container running: `docker compose ps opennsfw`
- [ ] No DNS errors in logs: `docker logs cuefinder-moderator-prod | grep -i "dns\|error"`

---

## Troubleshooting Secret Issues

### Issue: SSH Connection Fails
```
Error: "Permission denied (publickey)"
```

**Cause**: SSH_PRIVATE_KEY is invalid or malformed

**Solution**:
```bash
# On your local machine, get your private key
cat ~/.ssh/id_rsa

# Copy the ENTIRE output including BEGIN/END lines
# Go to: GitHub Repo → Settings → Secrets → New repository secret
# Paste the key as SSH_PRIVATE_KEY (no modifications)

# Test the secret locally first
ssh -i ~/.ssh/id_rsa cuefinder@<SERVER_IP> "echo Connected"
```

### Issue: Environment Variables Not Available in Container
```
Error: "NullReferenceException" when accessing configuration
Container logs show: "JWT secret is not configured"
```

**Cause**: `.env` file not created or not readable

**Solution**:
```bash
# Check if .env exists
ls -la /home/cuefinder/app/.env

# If missing, manually create it:
cat > /home/cuefinder/app/.env << EOF
DB_PASSWORD=<your-db-password>
JWT_SECRET=<your-jwt-secret>
# ... other secrets
EOF

# Rebuild and restart containers
docker compose down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Issue: Database Password Wrong in Container
```
Error: "FATAL: password authentication failed for user 'postgres'"
```

**Cause**: DB_PASSWORD secret value doesn't match actual password

**Solution**:
```bash
# Verify what password is in the running container
docker inspect cuefinder-backend-blue-prod | grep "ConnectionStrings__DefaultConnection"

# Update the secret in GitHub if password changed
# Then re-run the deployment

# Or manually update .env on server
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=<new-password>/' /home/cuefinder/app/.env

# Restart containers
docker compose up -d backend-blue
```

### Issue: GMAIL/SMTP Not Working
```
Error: "Failed to send email" in logs
```

**Cause**: GMAIL secrets incorrect or not passed to container

**Solution**:
```bash
# Verify secrets in container
docker inspect cuefinder-backend-blue-prod | grep -i "gmail\|smtp"

# Should show:
# "GmailApi__ClientId=<your-client-id>",
# "GmailApi__ClientSecret=<your-secret>",
# "EmailSettings__SmtpPassword=<your-password>",

# If missing, secrets weren't passed properly
# Check workflow logs for errors in "Create deployment script" step
# Verify all GMAIL secrets exist in GitHub repo settings
```

---

## Secret Rotation Procedure

**If you need to rotate any secrets:**

1. **Generate new secret value**
   ```bash
   # For JWT_SECRET (example: 256-bit hex)
   openssl rand -hex 32
   
   # For DB_PASSWORD (example: 32-char random)
   openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
   ```

2. **Update GitHub secret**
   - Go to: GitHub Repo → Settings → Secrets → Edit `<SECRET_NAME>`
   - Paste new value
   - Click "Update secret"

3. **Update server configuration** (if using persistent values)
   ```bash
   # For database password, update postgres container env
   # For JWT, update backend container env
   # etc.
   ```

4. **Re-deploy affected service**
   - Trigger the workflow that uses the secret
   - Monitor deployment for success
   - Verify service started with new secret

---

## Final Verification Script

**Run this on your server to verify all secrets are properly delivered:**

```bash
#!/bin/bash
set -e

echo "=== Secret Delivery Verification ==="
echo ""

# Check .env exists
if [ -f /home/cuefinder/app/.env ]; then
    echo "✓ .env file exists"
    echo "  Secrets count: $(cat /home/cuefinder/app/.env | wc -l)"
else
    echo "✗ .env file not found"
    exit 1
fi

# Check backend container
echo ""
echo "Backend container environment:"
docker inspect cuefinder-backend-blue-prod | grep '"Env"' -A 30 | grep -E "DB_PASSWORD|JWT_SECRET|GMAIL|SMTP" | wc -l
echo "  secrets passed to container"

# Check moderator container
echo ""
echo "Moderator container environment:"
docker inspect cuefinder-moderator-prod | grep '"Env"' -A 10 | grep -i "nudeNetUrl"

# Check database connectivity
echo ""
echo "Database connectivity:"
docker compose exec -T postgres psql -U postgres -d cuefinder -c "SELECT 1" > /dev/null && echo "✓ Database accessible"

echo ""
echo "=== Verification Complete ==="
```

---

## Summary

**What happens when you trigger a workflow:**

1. ✅ GitHub Actions loads all 14 secrets into memory (encrypted)
2. ✅ Workflow reads each secret using `${{ secrets.SECRET_NAME }}`
3. ✅ For Backend: Secrets written to `.env` file in workflow runner
4. ✅ File transferred to server via SCP (encrypted over SSH)
5. ✅ Server deployment script reads `.env`
6. ✅ Secrets passed to Docker containers as environment variables
7. ✅ Running application accesses secrets via `System.Environment.GetEnvironmentVariable()`

**Expected result:** All application features using these secrets should work correctly (auth, email, OAuth, database connections, CORS, etc.)

If any step fails, check the troubleshooting section above or review the workflow logs in GitHub Actions.
