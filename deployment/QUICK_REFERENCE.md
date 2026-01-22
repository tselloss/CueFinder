# 🚀 Production Quick Reference

## Pre-Deployment Checklist
```powershell
# 1. Verify configuration
.\deployment\verify-production-config.ps1

# 2. Generate secrets (if needed)
-join ((65..90)+(97..122)+(48..57)|Get-Random -Count 64|%{[char]$_})

# 3. Create .env.production
Copy-Item .env.production.example .env.production
notepad .env.production

# 4. Run security tests
cd tests\SecurityTests
.\run-security-tests.ps1 -All
```

## Service Ports
| Port | Service | Access |
|------|---------|--------|
| 80 | Nginx | External |
| 443 | Nginx | External |
| 5432 | PostgreSQL | Internal |
| 5000 | Backend | Internal |
| 5001 | Moderator | Internal |
| 8000 | OpenNSFW | Internal |

## Common Commands

### Start Production
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Stop Production
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### View Logs
```powershell
# All services
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### Check Status
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Restart Service
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

## Health Checks
```bash
curl http://localhost/api/health              # Backend
curl http://localhost/moderator/api/health    # Moderator
curl http://localhost/                        # Frontend
```

## Emergency Commands

### Database Backup
```powershell
docker exec cuefinder-postgres-prod pg_dump -U postgres cuefinder > backup.sql
```

### Database Restore
```powershell
Get-Content backup.sql | docker exec -i cuefinder-postgres-prod psql -U postgres cuefinder
```

### Full Reset (⚠️ DATA LOSS)
```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Required Environment Variables
```env
DB_PASSWORD=<64-char-password>
JWT_SECRET=<64-char-secret>
FRONTEND_API_URL=https://billiardscuefinder.com/api
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com
```

## Service URLs
- **Frontend**: https://billiardscuefinder.com
- **API**: https://billiardscuefinder.com/api
- **Moderator**: https://billiardscuefinder.com/moderator/api
- **Uploads**: https://billiardscuefinder.com/uploads

## Troubleshooting

### 502 Bad Gateway
```powershell
# Check backend is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps backend

# Check backend logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend

# Restart backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Database Connection Failed
```powershell
# Check PostgreSQL
docker exec cuefinder-postgres-prod pg_isready -U postgres

# Access database
docker exec -it cuefinder-postgres-prod psql -U postgres cuefinder
```

### OpenNSFW Slow Start
```powershell
# OpenNSFW downloads ML models on first start (60+ seconds)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs opennsfw

# Wait for: "Model loaded successfully"
```

## Documentation
- [PRODUCTION_TESTING_GUIDE.md](PRODUCTION_TESTING_GUIDE.md) - Complete testing guide
- [PRODUCTION_DOCKER_FIX.md](PRODUCTION_DOCKER_FIX.md) - What was fixed
- [SECURITY_IN_DEPLOYMENT.md](SECURITY_IN_DEPLOYMENT.md) - Security integration
- [verify-production-config.ps1](verify-production-config.ps1) - Config validator

---
✅ **All production issues fixed and ready to deploy!**
