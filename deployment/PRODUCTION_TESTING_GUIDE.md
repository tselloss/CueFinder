# Production Docker Testing Guide

## 🔍 Pre-Deployment Verification

### 1. Verify Configuration
```powershell
.\deployment\verify-production-config.ps1
```

This checks:
- ✅ `.env.production` exists and has required variables
- ✅ All Docker services are defined
- ✅ Ports are properly configured
- ✅ SSL configuration is valid
- ✅ All Dockerfiles exist
- ✅ Security headers are configured

### 2. Create .env.production
```powershell
# Copy template
Copy-Item .env.production.example .env.production

# Edit with your values
notepad .env.production
```

**Required variables:**
```env
DB_PASSWORD=<strong-password-here>
JWT_SECRET=<64-char-random-string>
FRONTEND_API_URL=https://billiardscuefinder.com/api
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com
```

**Generate secrets:**
```powershell
# Generate DB password
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate JWT secret (64 chars)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

---

## 🐳 Docker Configuration Fixed

### Changes Made:

#### ✅ docker-compose.prod.yml
1. **Added OpenNSFW service** - AI-based NSFW content detection
   - Container: `cuefinder-opennsfw-prod`
   - Internal port: 8000 (not exposed)
   - Memory: 2GB limit, 1GB reserved
   
2. **Added Moderator service** - Content moderation API
   - Container: `cuefinder-moderator-prod`
   - Internal port: 5001 (not exposed)
   - Connected to OpenNSFW for NSFW detection

3. **Fixed Backend configuration**
   - Added `Moderation__NudeNetUrl=http://cuefinder-opennsfw-prod:8000`
   - Added dependency on OpenNSFW service

4. **Added opennsfw_cache volume** - For ML model caching

#### ✅ nginx-ssl.conf
Added moderator API proxy:
```nginx
location ^~ /moderator/api/ {
    proxy_pass http://cuefinder-moderator-prod:5001/api/;
    ...
}
```

---

## 🔒 Production Port Configuration

### External Ports (Exposed to Internet)
| Port | Service | Purpose |
|------|---------|---------|
| 80 | nginx | HTTP (redirects to HTTPS) |
| 443 | nginx | HTTPS (SSL) |

### Internal Ports (Docker Network Only)
| Port | Service | Container Name |
|------|---------|----------------|
| 5432 | PostgreSQL | cuefinder-postgres-prod |
| 5000 | Backend API | cuefinder-backend-prod |
| 5001 | Moderator API | cuefinder-moderator-prod |
| 8000 | OpenNSFW | cuefinder-opennsfw-prod |
| 80 | Frontend | cuefinder-frontend-prod |

**Security:** All services except nginx are on internal Docker network only.

---

## 🚀 Testing Production Locally

### 1. Build and Start Services
```powershell
# Build all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 2. Verify Services Are Running
```powershell
# Check all containers
docker ps

# Expected output: 6 containers running
# - cuefinder-postgres-prod
# - cuefinder-opennsfw-prod
# - cuefinder-backend-prod
# - cuefinder-moderator-prod
# - cuefinder-frontend-prod
# - cuefinder-nginx-prod
```

### 3. Check Service Health
```powershell
# Backend health
curl http://localhost/api/health

# Moderator health (through nginx)
curl http://localhost/moderator/api/health

# Frontend
curl http://localhost/
```

### 4. Check Logs
```powershell
# All services
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs

# Specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs opennsfw
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs nginx

# Follow logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### 5. Test API Endpoints
```powershell
# Test main API (through nginx)
curl http://localhost/api/health

# Test with verbose
curl -v http://localhost/api/auth/register

# Test moderator API
curl http://localhost/moderator/api/health
```

---

## 🧪 Production Security Testing

### Run Security Tests Against Production Config
```powershell
cd tests\SecurityTests

# Start production services
docker compose -f ..\..\docker-compose.yml -f ..\..\docker-compose.prod.yml up -d

# Wait for services to start
Start-Sleep -Seconds 30

# Run security tests
.\run-security-tests.ps1 -All -ApiUrl "http://localhost"

# Check results
Get-Content security-report-*.json | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 🐛 Troubleshooting

### Issue: Services won't start
```powershell
# Check for port conflicts
Get-NetTCPConnection -LocalPort 80,443,5432

# Check Docker logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs

# Restart specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Issue: Database connection failed
```powershell
# Check PostgreSQL is healthy
docker exec cuefinder-postgres-prod pg_isready -U postgres

# Check connection string
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend env | grep ConnectionStrings

# Access database directly
docker exec -it cuefinder-postgres-prod psql -U postgres -d cuefinder
```

### Issue: OpenNSFW service slow to start
```powershell
# OpenNSFW downloads ML models on first start (60+ seconds)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs opennsfw

# Wait for: "Model loaded successfully"
```

### Issue: Nginx 502 Bad Gateway
```powershell
# Check backend is accessible from nginx container
docker exec cuefinder-nginx-prod wget -qO- http://cuefinder-backend-prod:5000/health

# Check nginx config
docker exec cuefinder-nginx-prod nginx -t

# Reload nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 📊 Service Dependencies

```
Internet (ports 80, 443)
    ↓
nginx (SSL termination)
    ├─→ frontend:80
    ├─→ backend:5000
    │   ├─→ postgres:5432
    │   └─→ opennsfw:8000
    └─→ moderator:5001
        ├─→ postgres:5432
        └─→ opennsfw:8000
```

---

## 🔄 Deployment Workflow

### Local Testing
1. ✅ Run `verify-production-config.ps1`
2. ✅ Build services locally
3. ✅ Test with production compose files
4. ✅ Run security tests
5. ✅ Check all health endpoints

### Server Deployment
1. ✅ Create `.env.production` on server
2. ✅ Upload SSL certificates to `/home/cuefinder/app/ssl/`
3. ✅ Run deployment script:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
4. ✅ Verify services are running
5. ✅ Run post-deployment security tests
6. ✅ Monitor logs for errors

---

## 🎯 Production Checklist

Before deploying to production server:

- [ ] `.env.production` created with strong passwords
- [ ] SSL certificates ready (Cloudflare Origin or Let's Encrypt)
- [ ] Domain DNS points to server IP
- [ ] Firewall allows ports 80, 443, 22
- [ ] All Dockerfiles present
- [ ] `verify-production-config.ps1` passes
- [ ] Local production test successful
- [ ] Security tests pass with 0 critical vulnerabilities
- [ ] Backup strategy configured
- [ ] Monitoring/logging configured

---

## 📝 Environment Variables Reference

### Required
```env
DB_PASSWORD              # PostgreSQL password
JWT_SECRET              # JWT signing key (64+ chars)
FRONTEND_API_URL        # https://yourdomain.com/api
CORS_FRONTEND_ORIGIN    # https://yourdomain.com
```

### Optional
```env
TWILIO_ACCOUNT_SID      # SMS verification
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

SMTP_HOST               # Email notifications
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
```

---

## 🆘 Emergency Commands

### Stop all services
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Restart with fresh database (⚠️ DATA LOSS)
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Backup database
```powershell
docker exec cuefinder-postgres-prod pg_dump -U postgres cuefinder > backup-$(Get-Date -Format 'yyyy-MM-dd').sql
```

### Restore database
```powershell
Get-Content backup-2026-01-22.sql | docker exec -i cuefinder-postgres-prod psql -U postgres cuefinder
```

---

## 📞 Support

For issues:
1. Check logs: `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs`
2. Verify config: `.\deployment\verify-production-config.ps1`
3. Run security tests: `.\tests\SecurityTests\run-security-tests.ps1 -All`
4. Review [SECURITY_IN_DEPLOYMENT.md](SECURITY_IN_DEPLOYMENT.md)
