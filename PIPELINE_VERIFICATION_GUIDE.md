# GitHub Actions Pipeline Verification Guide

## Overview
This document provides step-by-step instructions to verify all GitHub Actions pipelines are correctly configured and will execute with proper secret handling to your production server.

## GitHub Secrets Configuration Status

### ✅ Verified Secrets (All 14 Required)
- `SERVER_IP` - Production server IP address
- `SSH_PRIVATE_KEY` - SSH private key for deployment authentication
- `DB_PASSWORD` - PostgreSQL database password
- `JWT_SECRET` - JWT token secret for authentication
- `FRONTEND_API_URL` - Frontend API URL configuration
- `CORS_FRONTEND_ORIGIN` - CORS origin for frontend
- `GMAIL_CLIENT_ID` - Gmail OAuth client ID
- `GMAIL_CLIENT_SECRET` - Gmail OAuth client secret
- `GMAIL_PROJECT_ID` - Gmail OAuth project ID
- `SMTP_PASSWORD` - SMTP server password
- `SMTP_SERVER` - SMTP server hostname (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `EMAIL_FROM` - From email address (default: cuefinderinfo@gmail.com)

## Pipeline Architecture

### 1. Deploy Frontend Workflow (`deploy-frontend.yml`)
**Purpose**: Automated deployment of React frontend to production nginx

**Trigger Events**:
- ✅ Automatic: On push to `release` branch with CueFinderFE changes
- ✅ Manual: Via `workflow_dispatch` button in GitHub Actions UI

**Secret Usage**:
- Passes to: SSH authentication only (SERVER_IP, SSH_PRIVATE_KEY)
- Application-level secrets: None (frontend is static build)

**Jobs**:
1. **detect-changes**: Checks if CueFinderFE files changed
2. **test-frontend**: Runs `npm ci` and `npm run build` on Node 18
3. **deploy**: 
   - Sets up SSH with private key
   - Creates deployment script with latest frontend code
   - Transfers script via SCP
   - Executes via SSH on server
   - Verifies container health

**Verification Steps**:
```bash
# Step 1: Push test to release branch (or manually trigger)
git checkout release
git push origin release  # Or manually trigger at GitHub.com

# Step 2: Watch the workflow
# Go to: https://github.com/<your-repo>/actions/workflows/deploy-frontend.yml
# Click "Run workflow" button

# Step 3: Monitor output
# - Check "Detect Changes" job completes successfully
# - Check "Test Frontend" job runs npm build without errors  
# - Check "Deploy" job successfully:
#   * Connects via SSH
#   * Pulls latest code
#   * Builds frontend
#   * Deploys via Docker
#   * Passes health check

# Step 4: Manual verification on server
ssh cuefinder@<SERVER_IP>
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps frontend
# Should show: frontend ... Up (healthy)
```

---

### 2. Deploy Backend Workflow (`deploy-backend.yml`)
**Purpose**: Zero-downtime blue-green deployment of .NET backend

**Trigger Events**:
- ✅ Automatic: On push to `release` branch with CueFinderBE or SolutionLibraries changes
- ✅ Manual: Via `workflow_dispatch` with optional `skip-healthcheck` input

**Secret Usage** (passed to server via .env file):
- `SERVER_IP`, `SSH_PRIVATE_KEY` - SSH authentication
- `DB_PASSWORD` - Database connection
- `JWT_SECRET` - Token signing
- `FRONTEND_API_URL` - CORS configuration
- `CORS_FRONTEND_ORIGIN` - CORS configuration
- `SMTP_PASSWORD`, `SMTP_SERVER`, `SMTP_PORT`, `EMAIL_FROM` - Email service
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_PROJECT_ID` - OAuth service

**Jobs**:
1. **detect-changes**: Checks if backend files changed
2. **test-backend**: Runs `dotnet build` and `dotnet test` on .NET 8.0
3. **deploy**:
   - Sets up SSH
   - Creates deployment script that:
     * Pulls latest code
     * Creates .env file with all secrets
     * Runs blue-green deployment script
     * Swaps active backend slot
   - Transfers and executes via SSH

**Verification Steps**:
```bash
# Step 1: Manual trigger with skip-healthcheck (optional)
# Go to: https://github.com/<your-repo>/actions/workflows/deploy-backend.yml
# Click "Run workflow"
# Optionally check "Skip health checks" if needed

# Step 2: Monitor job outputs
# Check:
# - "Test Backend" runs dotnet build successfully
# - "Create deployment script" confirms .env file created
# - "Execute deployment" shows blue-green swap

# Step 3: Verify deployment on server
ssh cuefinder@<SERVER_IP>
cd /home/cuefinder/app

# Check which slot is active
cat .deployment/active_slot  # Should be "blue" or "green"

# Check running containers
docker compose ps | grep backend
# Should show:
# - cuefinder-backend-blue-prod (5001)
# - cuefinder-backend-green-prod (5002)

# Check active slot health
curl -X GET http://localhost:5001/api/health
# Or swap port to 5002 if green is active

# Verify environment variables were applied
docker inspect cuefinder-backend-blue-prod | grep -A 20 '"Env"'
# Should contain: JWT_SECRET, DB_PASSWORD, etc.
```

---

### 3. Deploy Infrastructure Workflow (`deploy-infra.yml`)
**Purpose**: Deploy database migrations, moderator service, and OpenNSFW

**Trigger Events**:
- ✅ Automatic: On push to `release` branch with migrations or infra changes
- ✅ Manual: Via `workflow_dispatch` with optional `skip-migrations` input

**Secret Usage**:
- `SERVER_IP`, `SSH_PRIVATE_KEY` - SSH authentication only
- Server-side: No secrets passed (services use docker-compose.prod.yml env)

**Jobs**:
1. **detect-changes**: Checks if migrations or services changed
2. **test-migrations**: Runs migrations against test PostgreSQL 15
3. **deploy**:
   - Sets up SSH
   - Creates deployment script that:
     * Pulls latest code
     * Creates `/home/cuefinder/backups` directory if missing
     * Backs up database
     * Runs migrations
     * Rebuilds and redeploys opennsfw + moderator

**Verification Steps**:
```bash
# Step 1: Manual trigger
# Go to: https://github.com/<your-repo>/actions/workflows/deploy-infra.yml
# Click "Run workflow"
# Optionally check "Skip migrations" if needed

# Step 2: Monitor test job
# "Test Database Migrations" should run all SQL files successfully

# Step 3: Monitor deploy job
# Should show:
# - /home/cuefinder/backups directory created
# - Database backup created
# - All migrations applied
# - opennsfw and moderator rebuilt and deployed

# Step 4: Verify on server
ssh cuefinder@<SERVER_IP>
cd /home/cuefinder/app

# Check backup directory exists
ls -la /home/cuefinder/backups/  # Should contain .sql backup files

# Check services are running
docker compose ps | grep -E "opennsfw|moderator|postgres"

# Should show:
# - cuefinder-postgres-prod (Up)
# - cuefinder-opennsfw-prod (Up) 
# - cuefinder-moderator-prod (Up)

# Check service logs for any errors
docker compose logs moderator --tail 50
docker compose logs opennsfw --tail 50

# Verify moderator can reach OpenNSFW
docker compose exec moderator curl -X GET http://cuefinder-opennsfw-prod:8000/
# Should return: {"status": "ok"} or similar

# Verify database connection
docker compose exec moderator dotnet "<<path-to-app>>" check-db
```

---

## Secret Passing Flow

### Frontend Deployment
```
GitHub Secrets
├─ SERVER_IP
└─ SSH_PRIVATE_KEY
      ↓
SSH setup in workflow
      ↓
Deploy via SSH (no application secrets needed)
```

### Backend Deployment
```
GitHub Secrets
├─ SERVER_IP
├─ SSH_PRIVATE_KEY
├─ DB_PASSWORD
├─ JWT_SECRET
├─ FRONTEND_API_URL
├─ CORS_FRONTEND_ORIGIN
├─ SMTP_PASSWORD
├─ SMTP_SERVER
├─ SMTP_PORT
├─ EMAIL_FROM
├─ GMAIL_CLIENT_ID
├─ GMAIL_CLIENT_SECRET
└─ GMAIL_PROJECT_ID
      ↓
Create .env file in workflow
      ↓
Transfer .env + deployment script via SCP
      ↓
SSH executes deployment script
      ↓
Script reads .env and passes to docker-compose via env vars
      ↓
Backend container receives all secrets as environment variables
```

### Infrastructure Deployment
```
GitHub Secrets
├─ SERVER_IP
└─ SSH_PRIVATE_KEY
      ↓
SSH setup in workflow
      ↓
Deploy via SSH (services use docker-compose.prod.yml for secrets)
```

---

## Manual Workflow Trigger Procedure

### Via GitHub UI (Easiest)
1. Go to **Actions** tab in your repository
2. Select desired workflow:
   - "Deploy Frontend"
   - "Deploy Backend (Zero-Downtime)"
   - "Deploy Infrastructure (DB, Moderation, etc)"
3. Click **"Run workflow"** button
4. (Optional) Provide inputs:
   - Backend: `skip-healthcheck` checkbox
   - Infrastructure: `skip-migrations` checkbox
5. Click green **"Run workflow"** button
6. Watch the job output in real-time

### Full Production Deployment Order
**Recommended sequence for complete deployment:**

```bash
# Step 1: Infrastructure first (prepares database and services)
1. Go to Actions → "Deploy Infrastructure"
2. Click "Run workflow" 
3. Wait for completion (5-10 minutes)

# Step 2: Backend deployment (uses prepared database)
4. Go to Actions → "Deploy Backend (Zero-Downtime)"
5. Click "Run workflow"
6. Wait for completion (5-10 minutes)

# Step 3: Frontend deployment (uses ready backend)
7. Go to Actions → "Deploy Frontend"
8. Click "Run workflow"
9. Wait for completion (3-5 minutes)
```

---

## Troubleshooting

### Issue: Workflow doesn't run when manually triggered
**Solution**: 
- Verify `workflow_dispatch:` is in the workflow YAML
- Ensure the branch is `release` (for automatic triggers)
- Check "Run workflow" button shows up in Actions tab
- All three workflows have this enabled ✅

### Issue: SSH connection fails during deployment
**Potential causes**:
- `SSH_PRIVATE_KEY` secret is incorrect or corrupted
- `SERVER_IP` secret doesn't match actual server IP
- Server SSH port is not 22 (adjust workflow if needed)

**Solution**:
```bash
# Verify server is reachable
ping <SERVER_IP>

# Verify SSH key works locally
ssh -i ~/.ssh/private_key cuefinder@<SERVER_IP> "echo Connected"

# Update secrets if needed:
# GitHub Repo → Settings → Secrets and variables → Repository secrets
```

### Issue: Deployment script runs but secrets aren't available on server
**Solution**: 
- Backend: Check .env file was created: `cat /home/cuefinder/app/.env`
- Verify environment variables in running container: 
  ```bash
  docker inspect cuefinder-backend-blue-prod | grep '"Env"' -A 20
  ```
- Check application logs: `docker logs cuefinder-backend-blue-prod`

### Issue: Moderator service DNS error (cannot reach opennsfw)
**Probable cause**: 
- Containers not on same network
- opennsfw container not starting
- Network connectivity issue

**Solution**:
```bash
# Check networks
docker network ls | grep cuefinder

# Verify both containers on same network
docker network inspect cuefinder-network

# Check container logs
docker logs cuefinder-moderator-prod
docker logs cuefinder-opennsfw-prod

# Test connectivity between containers
docker compose exec moderator curl -v http://cuefinder-opennsfw-prod:8000/

# If still failing, rebuild and restart services
docker compose down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Pre-Deployment Checklist

Before running workflows, verify:

- [ ] All 14 GitHub secrets are configured (check repo Settings → Secrets)
- [ ] Latest code is committed and pushed to `release` branch
- [ ] Server is accessible via SSH: `ssh cuefinder@<SERVER_IP>`
- [ ] Docker and Docker Compose are running on server
- [ ] PostgreSQL container exists: `docker ps | grep postgres`
- [ ] Sufficient disk space on server: `df -h`
- [ ] Backup directory is writable: `ls -la /home/cuefinder/backups/`

---

## Success Indicators

### ✅ Frontend Deployment Success
- [ ] Workflow shows all 3 jobs completed (green checkmarks)
- [ ] Build completes with no ESLint errors
- [ ] Frontend container is healthy on server
- [ ] Website loads at `https://billiardscuefinder.com`

### ✅ Backend Deployment Success
- [ ] Workflow shows all 3 jobs completed
- [ ] Build completes with no compilation errors
- [ ] Blue-green slot swapped successfully
- [ ] Health check passes on active port
- [ ] API responds to requests: `curl https://billiardscuefinder.com/api/health`

### ✅ Infrastructure Deployment Success
- [ ] Workflow shows all 3 jobs completed
- [ ] Migrations complete without SQL errors
- [ ] Database backup created in `/home/cuefinder/backups/`
- [ ] OpenNSFW container starts successfully
- [ ] Moderator container starts successfully
- [ ] Services can communicate across network

---

## Next Steps

1. **Immediate**: Verify all secrets are present (you've shown the screenshot ✓)
2. **Test Frontend**: Go to Actions tab and manually trigger Frontend deploy
3. **Test Backend**: After frontend succeeds, trigger Backend deploy
4. **Test Infrastructure**: After backend succeeds, trigger Infrastructure deploy
5. **Monitor**: Watch each job output for any errors
6. **Verify Server**: SSH into server and check all services running
7. **Test Application**: Visit site and test critical flows (auth, search, forum, etc.)

If any workflow fails, check the job output for the specific error and consult the Troubleshooting section above.
