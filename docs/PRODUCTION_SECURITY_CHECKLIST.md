# Production Security Checklist - CueFinder

**Status:** ✅ **CRITICAL FIXES APPLIED**  
**Date:** January 30, 2026  
**Version:** 1.0

---

## 🔴 CRITICAL - MUST COMPLETE BEFORE DEPLOYMENT

### 1. ✅ Environment Variables Configuration
- [x] Created comprehensive `.env.production` file with all required variables
- [x] Updated `appsettings.Production.json` to use environment variable templates
- [ ] **TODO: Fill in actual production values**

**Action Required:**
```bash
# Edit .env.production with real production values
nano .env.production

# Fill in these fields:
# - DB_PASSWORD (32+ chars, strong)
# - JWT_SECRET (64+ chars, strong)
# - SMTP_PASSWORD (Gmail app password)
# - GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET
# - Domain names
```

### 2. ✅ SSL/HTTPS Configuration
- [x] Created setup script with SSL instructions
- [ ] **TODO: Generate SSL certificates**

**Action:**
```bash
# Let's Encrypt (Recommended)
sudo certbot certonly --standalone -d billiardscuefinder.com
sudo cp /etc/letsencrypt/live/billiardscuefinder.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/billiardscuefinder.com/privkey.pem ./ssl/key.pem
```

### 3. ✅ Database Persistence
- [x] Verified Docker volume configuration
- [x] Created backup automation
- [ ] **TODO: Create database directories**

```bash
mkdir -p /home/cuefinder/data/postgres
mkdir -p /home/cuefinder/backups
chmod 700 /home/cuefinder/data/postgres
```

### 4. ✅ Secrets Management
- [x] Removed hardcoded secrets from config files
- [x] Updated to use environment variables
- [ ] **TODO: Verify .env.production in .gitignore**

```bash
grep "\.env\.production" .gitignore
```

### 5. ✅ Deployment Safety
- [x] Created `deploy-production.sh` script
- [x] Created `setup-production.sh` script
- [x] Created automated backup script
- [ ] **TODO: Test on staging first**

---

## 🟡 IMPORTANT - COMPLETE BEFORE GO-LIVE

- [ ] Daily backup verification (30-day retention)
- [ ] SSL certificate auto-renewal configured
- [ ] Container health checks verified
- [ ] Admin email working
- [ ] API health endpoint responding
- [ ] HTTPS only (HTTP disabled)
- [ ] Rate limiting configured
- [ ] Logs monitored

---

## File Changes Applied

✅ `.env.production` - Complete production template
✅ `appsettings.Production.json` - Environment variable integration
✅ `docker-compose.prod.yml` - No changes needed (already correct)
✅ `setup-production.sh` - Pre-deployment checklist
✅ `deploy-production.sh` - Safe deployment script
✅ Backup automation - Created `backup-db.sh`

---

## CRITICAL WARNING

⚠️ **NEVER use `docker-compose down -v` in production - it DELETES the database!**

Always use: `docker-compose down` (without -v flag)

---

## Next Steps

1. Complete all 🔴 CRITICAL items
2. Complete all 🟡 IMPORTANT items
3. Run: `bash setup-production.sh`
4. Test on staging server
5. Run: `bash deploy-production.sh`
6. Monitor: `docker-compose logs -f`

Refer to PRODUCTION_READINESS_REPORT.md for full details.
