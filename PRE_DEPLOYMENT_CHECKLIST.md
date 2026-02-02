# Pre-Deployment Checklist - DEV → Release

## ✅ What's Ready to Deploy

### 1. **GitHub Actions Workflows** (FIXED ✅)
- ✅ Infrastructure pipeline creates .env with all secrets
- ✅ Variable expansion fixed (heredoc without quotes for secrets)
- ✅ Server-side vs GitHub Actions variables properly escaped
- ✅ Backend pipeline already had .env creation
- ✅ All 3 workflows support manual trigger (workflow_dispatch)

### 2. **Docker Compose Production Config** (VERIFIED ✅)
```yaml
Ports Configuration:
- PostgreSQL: NO external ports (internal only) ✅
- PgAdmin: NO external ports ✅
- OpenNSFW: NO external ports (internal 8000) ✅
- Moderator: NO external ports (internal 5001) ✅
- Frontend: NO external ports (internal 80) ✅
- Backend Blue: 5001 (blue-green deployment) ✅
- Backend Green: 5002 (blue-green deployment) ✅
- Nginx: 80, 443 (ONLY public-facing service) ✅
```

**✅ Security: Only nginx is exposed to internet (ports 80/443)**

### 3. **Container Dependencies** (FIXED ✅)
- ✅ Frontend depends on `backend-blue` (not non-existent 'backend')
- ✅ Nginx depends on `frontend` AND `backend-blue` with health checks
- ✅ All services have proper health checks
- ✅ Services wait for dependencies to be healthy before starting

### 4. **Database Safety** (IMPLEMENTED ✅)
- ✅ Automatic backups before migrations
- ✅ Backup management script (`manage-backups.sh`)
- ✅ Database integrity verification script
- ✅ Comprehensive documentation (6 guides created)
- ✅ Quick reference guide for operations

### 5. **Environment Variables** (CONFIGURED ✅)
All 11 GitHub Secrets configured and will be deployed:
- ✅ DB_PASSWORD
- ✅ JWT_SECRET
- ✅ FRONTEND_API_URL
- ✅ CORS_FRONTEND_ORIGIN
- ✅ SMTP_PASSWORD
- ✅ SMTP_SERVER
- ✅ SMTP_PORT
- ✅ EMAIL_FROM
- ✅ GMAIL_CLIENT_ID
- ✅ GMAIL_CLIENT_SECRET
- ✅ GMAIL_PROJECT_ID

### 6. **Blue-Green Deployment** (CONFIGURED ✅)
- ✅ Backend blue container on port 5001
- ✅ Backend green container on port 5002
- ✅ Automatic health check and traffic switching
- ✅ Zero-downtime deployments
- ✅ Rollback capability

---

## ⚠️ Known Issues to Address

### 1. **PostgreSQL Migration Scripts** (DOCUMENTED ⚠️)
- ❌ Migration scripts use SQL Server syntax (PascalCase table names)
- ❌ Entity Framework creates lowercase PostgreSQL tables
- ✅ **Fix script created**: `scripts/fix-postgresql-migrations.sql`
- ✅ **Documentation created**: `POSTGRESQL_MIGRATION_FIX.md`

**Action Required After Merge:**
1. Run `fix-postgresql-migrations.sql` on production database
2. OR: Update all migration scripts to use PostgreSQL syntax
3. OR: Let EF Core handle schema (recommended)

### 2. **First-Time Deployment Sequence**
The FIRST deployment to production server requires specific order:

```bash
# Step 1: Run infrastructure deployment FIRST
# This creates .env file and starts postgres
Workflow: Deploy Infrastructure

# Step 2: Backend starts and EF Core creates schema
# Backend depends on postgres, will auto-migrate
Workflow: Deploy Backend

# Step 3: Frontend builds with API URL
Workflow: Deploy Frontend
```

**Why this order?**
- Infrastructure creates .env with secrets
- Backend needs .env to connect to postgres
- EF Core automatically creates PostgreSQL tables
- Then run fix-postgresql-migrations.sql for additional columns/indexes

---

## 🔍 Pre-Merge Verification

### Check Current Branch Status
```powershell
# You are on: DEV
# Will merge to: release (production)

# Commits ready to merge:
c6cdf47 fix: Remove escape from GitHub Actions variables in scp/ssh commands
1946aec fix: Escape server-side variables in deployment script
4d29626 fix: Enable variable expansion in infrastructure deployment script
c96bf83 Add PostgreSQL migration fix and update documentation
bb0fd7f fix: Add .env file creation to infrastructure deployment pipeline
fb8f83b docs: Add comprehensive summary of database protection implementation
(+ 13 more commits with fixes and documentation)
```

### Files Modified in DEV
- ✅ `.github/workflows/deploy-infra.yml` - FIXED .env creation and variables
- ✅ `.github/workflows/deploy-backend.yml` - Already had .env creation
- ✅ `.github/workflows/deploy-frontend.yml` - No changes needed
- ✅ `docker-compose.prod.yml` - Fixed container dependencies
- ✅ `scripts/fix-postgresql-migrations.sql` - NEW: PostgreSQL compatibility fix
- ✅ 10 documentation files created

---

## 🚀 Merge and Deploy Procedure

### Step 1: Merge DEV to Release
```powershell
# Switch to release branch
git checkout release

# Merge DEV (will create merge commit)
git merge DEV

# Push to GitHub
git push origin release
```

### Step 2: Trigger Deployments (Automatic or Manual)

**Option A: Automatic (Recommended)**
- Push to release triggers all workflows automatically
- Workflows detect changes and deploy only affected services

**Option B: Manual**
1. Go to: https://github.com/tselloss/CueFinder/actions
2. Run workflows in order:
   - Deploy Infrastructure (first - creates .env)
   - Deploy Backend (second - starts backend with EF migrations)
   - Deploy Frontend (third - builds with API URL)

### Step 3: Post-Deployment Verification
```bash
# SSH to server
ssh cuefinder@116.203.137.201

# Check all containers running
cd ~/app
docker compose ps

# Verify .env file exists and has values
ls -la .env
head -3 .env  # Don't cat full file (has passwords)

# Check postgres is ready
docker exec cuefinder-postgres-prod psql -U postgres -d cuefinder -c "\dt"

# Check logs
docker compose logs backend-blue --tail=50
docker compose logs frontend --tail=50
docker compose logs nginx --tail=50
```

### Step 4: Run PostgreSQL Migration Fix (If Needed)
```bash
# On server, after backend is running
cd ~/app

# Check if tables exist (lowercase)
docker exec cuefinder-postgres-prod psql -U postgres -d cuefinder -c "\dt"

# If columns are missing, run fix script
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder < scripts/fix-postgresql-migrations.sql

# Verify columns added
docker exec cuefinder-postgres-prod psql -U postgres -d cuefinder -c "\d users"
```

---

## 🔒 Security Verification Checklist

After deployment, verify:
- [ ] Only ports 80 and 443 are exposed to internet
- [ ] PostgreSQL port 5432 is NOT accessible externally
- [ ] PgAdmin is NOT accessible externally
- [ ] OpenNSFW moderation service is internal only
- [ ] Moderator service is internal only
- [ ] Backend blue/green ports are internal only
- [ ] All sensitive data in .env (not in docker-compose.yml)
- [ ] SSL certificates are in place for HTTPS

---

## 📊 Resource Limits (Verified ✅)

```yaml
PostgreSQL:  1GB limit, 512MB reserved
Backend:     1GB limit, 512MB reserved
OpenNSFW:    2GB limit, 1GB reserved
Moderator:   512MB limit, 256MB reserved
Frontend:    512MB limit, 256MB reserved
```

**Total Memory Usage:** ~5GB max, ~2.5GB reserved
**Server:** 8GB RAM ✅ (sufficient)

---

## 🎯 Success Criteria

After deployment, all of these should work:
- [ ] Website accessible at https://billiardscuefinder.com
- [ ] API responds at /api/health
- [ ] User registration works
- [ ] User login works
- [ ] Email sending works (forgot password)
- [ ] Image uploads work
- [ ] Cue listing/search works
- [ ] Forum works
- [ ] No errors in browser console
- [ ] No errors in docker logs

---

## 🔄 Rollback Plan (If Issues)

If deployment fails:
```bash
# Option 1: Use blue-green rollback (if backend issue)
cd ~/app
docker compose restart backend-green  # If blue is broken

# Option 2: Revert git
git revert HEAD --no-edit
git push origin release

# Option 3: Restore database backup
cd ~/backups
ls -lt | head -5  # Find latest backup
docker exec -i cuefinder-postgres-prod psql -U postgres -d cuefinder < cuefinder_backup_YYYYMMDD_HHMMSS.sql
```

---

## ✅ READY TO DEPLOY

**All critical issues fixed:**
- ✅ .env file creation works
- ✅ Variable expansion fixed
- ✅ Container dependencies correct
- ✅ Port configuration secure
- ✅ Database backups automated
- ✅ Blue-green deployment configured

**Documentation complete:**
- ✅ 10 comprehensive guides created
- ✅ Quick reference available
- ✅ Troubleshooting guides included

**Merge DEV to release when ready!** 🚀
