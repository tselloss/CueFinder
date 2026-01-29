# Production Deployment Checklist for CueFinder

## Overview
This checklist ensures proper port configuration and all necessary settings for deploying CueFinder to production. The key change from development is that production runs behind an Nginx reverse proxy on standard ports (80 HTTP, 443 HTTPS), while the backend and other services run on internal ports.

---

## Port Configuration Strategy

### Development Environment
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend API**: http://localhost:5200 (ASP.NET Kestrel)
- **E2E Tests**: Connect to localhost:5200 for API
- **Direct URLs**: http://127.0.0.1:3000, http://127.0.0.1:5200

### Production Environment
- **Public Frontend**: https://yourdomain.com (Nginx port 443)
- **Public API**: https://yourdomain.com/api (Nginx port 443, proxied to backend)
- **Backend Internal**: http://localhost:5000 (Docker internal, NOT exposed)
- **Moderation Service**: http://cuefinder-moderator-prod:5001 (Docker internal)
- **Public only accesses via Nginx**: Ports 80 (redirect to 443) and 443

### Key Change: Port 5200 → 5000
- **In Development**: Backend uses port 5200 (configured in launchSettings.json)
- **In Production Docker**: Backend uses port 5000 (configured in appsettings.Production.json)
- **Why**: Follows Docker best practices; Nginx reverse proxy is the only public-facing service

---

## Pre-Deployment Checklist

### 1. Backend Configuration
- [ ] **appsettings.Production.json** is configured with:
  - [ ] `CorsOrigins.Frontend`: Set to your production domain (e.g., `https://yourdomain.com`)
  - [ ] `ModerationServiceUrl`: Points to production moderator service
  - [ ] `JWT.Secret`: Changed from default (use environment variable in production)
  - [ ] `EmailSettings`: SMTP server, port, credentials configured
  - [ ] `ImageStorage.StoragePath`: Points to production persistent volume
  - [ ] Database connection string: Set via environment variable, not in appsettings
- [ ] **Kestrel.Endpoints.Http**: Set to `http://0.0.0.0:5000` (internal port)
- [ ] **Program.cs**: Verify CORS middleware accepts production domain
- [ ] **Database**: Migrations run on production database
- [ ] **Sensitive Data**: All secrets stored in environment variables or Docker secrets, NOT in config files

### 2. Frontend Configuration
- [ ] **apiConfig.js** logic is:
  - Priority 1: `process.env.REACT_APP_API_URL` (set at build time)
  - Priority 2: Default to relative path `/api` (works behind Nginx proxy)
  - Fallback: Does NOT hardcode localhost URLs in production build
- [ ] **Build Configuration**: Docker build command includes:
  ```bash
  --build-arg REACT_APP_API_URL=https://yourdomain.com
  ```
  OR via environment variable:
  ```bash
  REACT_APP_API_URL=https://yourdomain.com npm run build
  ```
- [ ] **Production Build Output**: No `localhost:` references in built files
- [ ] **Hash Router**: Verify all routes use `/#/path` format (already configured)
- [ ] **Environment Variables**: 
  - [ ] Set during Docker image build
  - [ ] NOT hardcoded in commits
  - [ ] Uses `.env.production` for build-time variables

### 3. Docker Configuration
- [ ] **docker-compose.prod.yml** configured with:
  - [ ] Backend service: Port `5000` (internal), no port exposure to host
  - [ ] Frontend service: Built with `REACT_APP_API_URL` environment variable
  - [ ] Nginx service: Port `80` and `443` exposed to host
  - [ ] Volume mounts: `/uploads` persists across container restarts
  - [ ] Network isolation: Services communicate via Docker internal network
  - [ ] Environment variables: Database URL, JWT secret, email settings, etc.
- [ ] **Backend Dockerfile**:
  - [ ] Uses `EXPOSE 5000` (internal port, not public)
  - [ ] Runs production build: `dotnet build -c Release`
  - [ ] HEALTHCHECK endpoint: `/api/health` for orchestration
- [ ] **Frontend Dockerfile**:
  - [ ] Build stage includes build args for environment variables
  - [ ] Production stage serves static files via Nginx
  - [ ] Base image: `node:18` → `nginx:alpine` (minimal)

### 4. Nginx Reverse Proxy Configuration
- [ ] **nginx.conf** or **nginx-ssl.conf** configured with:
  - [ ] SSL certificates:
    - [ ] `ssl_certificate /etc/nginx/certs/cert.pem;`
    - [ ] `ssl_certificate_key /etc/nginx/certs/key.pem;`
    - [ ] Certificates mounted as Docker volumes from `/etc/letsencrypt/live/yourdomain.com`
  - [ ] Server name: Points to your domain
  - [ ] Port 80: Redirects HTTP to HTTPS (301 redirect)
  - [ ] Port 443: Serves frontend + proxies `/api` to backend
  - [ ] Proxy to Backend:
    ```nginx
    location /api {
      proxy_pass http://backend-service:5000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
    ```
  - [ ] Static Frontend:
    ```nginx
    location / {
      root /usr/share/nginx/html;
      try_files $uri /index.html;
    }
    ```
  - [ ] CORS Headers: Verify they're set correctly in backend, not needed in Nginx
  - [ ] Gzip compression enabled for API responses

### 5. SSL/TLS Certificates
- [ ] **Certificate Source**:
  - [ ] Option A: Let's Encrypt (free, auto-renew with certbot)
  - [ ] Option B: Purchased from CA (manual renewal)
  - [ ] Option C: Self-signed for staging/testing
- [ ] **Location**: `/etc/letsencrypt/live/yourdomain.com/` on host machine
- [ ] **Docker Volume Mount**:
  ```yaml
  volumes:
    - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/certs:ro
  ```
- [ ] **Permissions**: Certificates readable by Nginx container
- [ ] **Auto-Renewal**: Certbot scheduled task or cron job running on host

### 6. Environment Variables (Production Server)
Set these on your production server BEFORE running Docker Compose:

```bash
# Database
DB_HOST=your-database-host
DB_NAME=cuefinder_prod
DB_USER=prod_user
DB_PASSWORD=SECURE_PASSWORD_HERE

# Backend
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=YOUR_SECURE_JWT_SECRET_HERE
ASPNETCORE_URLS=http://+:5000

# Frontend Build Time
REACT_APP_API_URL=https://yourdomain.com

# Email
SMTP_SERVER=your-email-provider.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=SECURE_PASSWORD_HERE

# Moderator Service
MODERATOR_API_URL=http://cuefinder-moderator-prod:5001
MODERATOR_SECRET=SECURE_SECRET_HERE

# Optional: Image Storage
IMAGE_STORAGE_PATH=/var/lib/cuefinder/uploads
```

### 7. Database
- [ ] **Production Database Created**: PostgreSQL or SQL Server on production server
- [ ] **Backup Strategy**: 
  - [ ] Daily backups configured
  - [ ] Backups stored off-site or in separate storage
  - [ ] Restore procedure tested
- [ ] **Migrations Applied**: All migrations run on production database
- [ ] **Connection String**: Uses environment variable, not hardcoded
- [ ] **User Permissions**: Database user has minimal required permissions (no DROP/ALTER privileges)

### 8. Persistent Storage
- [ ] **Upload Directory**: Created on host: `/var/lib/cuefinder/uploads`
- [ ] **Permissions**: Directory writable by Docker containers (uid 101 for Nginx)
- [ ] **Volume Mounts**: 
  ```yaml
  volumes:
    - /var/lib/cuefinder/uploads:/var/lib/cuefinder/uploads
  ```
- [ ] **Disk Space**: Sufficient space for user uploads (monitor regularly)
- [ ] **Backup Included**: Upload directory included in backup strategy

### 9. Monitoring & Logging
- [ ] **Application Logging**: Configured to log to `/var/log/cuefinder/`
- [ ] **Docker Logs**: Accessible via `docker logs <container>`
- [ ] **Health Checks**: 
  - [ ] Backend: `/api/health` endpoint responds
  - [ ] Frontend: Accessible via `https://yourdomain.com`
  - [ ] Database: Connectivity verified
- [ ] **Error Monitoring**: Optional - Sentry, DataDog, or similar configured
- [ ] **Uptime Monitoring**: Optional - UptimeRobot or similar monitoring public endpoints

### 10. Security
- [ ] **API CORS**: Only allows production frontend domain
- [ ] **HTTPS Only**: HTTP (port 80) redirects to HTTPS (port 443)
- [ ] **Headers Security**: Nginx configured with security headers:
  ```nginx
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  ```
- [ ] **Rate Limiting**: Optional - configured on Nginx or backend
- [ ] **Secrets Management**: No secrets in Git, use environment variables
- [ ] **Docker Registry**: Private registry if using custom images
- [ ] **Network Isolation**: Firewall rules restrict port access:
  - [ ] 80/443: Open to public
  - [ ] 22 (SSH): Open to admin IPs only
  - [ ] 3000, 5000, 5001: NOT accessible from outside

---

## Deployment Steps

### Step 1: Prepare Production Server
```bash
# SSH into production server
ssh admin@yourdomain.com

# Create application directories
sudo mkdir -p /var/lib/cuefinder/uploads
sudo mkdir -p /var/log/cuefinder
sudo mkdir -p /etc/cuefinder

# Set permissions
sudo chown -R ubuntu:ubuntu /var/lib/cuefinder
sudo chown -R ubuntu:ubuntu /var/log/cuefinder

# Create .env file with production variables
nano /etc/cuefinder/.env.production
# [Paste environment variables from section 6 above]
```

### Step 2: Clone Repository and Build
```bash
# Navigate to deployment directory
cd /home/ubuntu/deployments

# Clone repository
git clone https://github.com/yourusername/CueFinder.git cuefinder-prod
cd cuefinder-prod

# Load environment variables
export $(cat /etc/cuefinder/.env.production | xargs)

# Build frontend with production API URL
cd CueFinderFE/cuefinderfe
REACT_APP_API_URL=https://yourdomain.com npm run build
cd ../../

# Build Docker images
docker-compose -f docker-compose.prod.yml build
```

### Step 3: Deploy Services
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Verify containers are running
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 4: Verify Deployment
```bash
# Test API endpoint
curl https://yourdomain.com/api/health

# Test frontend
curl https://yourdomain.com

# Check SSL certificate
curl -I https://yourdomain.com

# Verify no localhost references
grep -r "localhost" CueFinderFE/cuefinderfe/dist/ || echo "No localhost references found ✓"
```

### Step 5: Run E2E Tests Against Production (Optional)
```bash
# Create environment-specific test configuration
cd CueFinderFE/cuefinderfe

# Run tests against production
REACT_APP_API_URL=https://yourdomain.com npm run test:e2e

# Verify critical flows:
# - User registration
# - User login
# - Add billiard table
# - Search functionality
# - Moderation review
```

---

## Common Production Issues & Solutions

### Issue 1: API Not Responding (503 Service Unavailable)
**Symptom**: Frontend loads but API calls fail with 503 errors

**Diagnosis**:
```bash
# Check if backend container is running
docker-compose -f docker-compose.prod.yml ps

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Test direct connection to backend
docker-compose -f docker-compose.prod.yml exec backend curl http://localhost:5000/api/health
```

**Solutions**:
- [ ] Verify backend container is running: `docker-compose up -d backend`
- [ ] Check database connectivity in backend logs
- [ ] Verify environment variables are set: `docker-compose config | grep -i database`
- [ ] Check Nginx proxy configuration: `docker exec cuefinder-nginx nginx -t`

### Issue 2: Frontend Returns 404 on Refresh
**Symptom**: Navigating to routes like `/profile` returns 404 (should redirect to `/index.html`)

**Diagnosis**:
```bash
# Check Nginx configuration
docker exec cuefinder-nginx cat /etc/nginx/conf.d/default.conf | grep -A5 "try_files"

# Test with curl
curl -I https://yourdomain.com/profile
```

**Solutions**:
- [ ] Verify Nginx `try_files $uri /index.html;` is configured
- [ ] Restart Nginx: `docker-compose -f docker-compose.prod.yml restart nginx`
- [ ] Check hash routing is enabled: frontend uses `HashRouter`, not `BrowserRouter`

### Issue 3: Mixed Content Warning (HTTPS Page Loading HTTP)
**Symptom**: Browser shows "Mixed Content" warning

**Diagnosis**:
```bash
# Check frontend build for hardcoded http:// URLs
grep -r "http://" CueFinderFE/cuefinderfe/dist/

# Check API configuration
grep -r "localhost:5000" CueFinderFE/cuefinderfe/dist/
```

**Solutions**:
- [ ] Rebuild frontend with `REACT_APP_API_URL=https://yourdomain.com`
- [ ] Verify apiConfig.js uses relative paths by default: `'/api'` not `'http://...'`
- [ ] Restart frontend container after rebuild

### Issue 4: CORS Errors When Calling API
**Symptom**: Browser console shows CORS errors from `https://yourdomain.com/api`

**Diagnosis**:
```bash
# Check backend CORS configuration
docker-compose -f docker-compose.prod.yml exec backend \
  grep -A5 "CorsOrigins" /app/appsettings.Production.json

# Check what domain is being sent
curl -I -H "Origin: https://yourdomain.com" https://yourdomain.com/api/health
```

**Solutions**:
- [ ] Verify `appsettings.Production.json` `CorsOrigins.Frontend` matches production domain
- [ ] Restart backend container: `docker-compose -f docker-compose.prod.yml restart backend`
- [ ] Check backend logs for CORS rejection: `docker-compose logs backend | grep -i cors`

### Issue 5: SSL Certificate Expired
**Symptom**: Browser shows certificate expired warning

**Diagnosis**:
```bash
# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -noout -dates

# Check Nginx is using correct certificate path
docker exec cuefinder-nginx nginx -T | grep -i "ssl_certificate"
```

**Solutions**:
- [ ] Renew Let's Encrypt certificate: `sudo certbot renew`
- [ ] Reload Nginx: `docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload`
- [ ] Set up auto-renewal cron job: `sudo certbot renew --dry-run`

### Issue 6: Database Connection Timeout
**Symptom**: Backend logs show database connection errors

**Solutions**:
- [ ] Verify database host and port: `docker-compose config | grep DB_HOST`
- [ ] Test connectivity: `docker-compose -f docker-compose.prod.yml exec backend curl -v <DB_HOST>:<DB_PORT>`
- [ ] Check database is running and accepting connections
- [ ] Verify credentials in environment variables
- [ ] Check firewall rules allow database connections

---

## Rollback Procedure

If deployment fails or causes issues:

```bash
# Stop all containers
docker-compose -f docker-compose.prod.yml down

# Revert to previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d

# Verify everything is working
curl https://yourdomain.com/api/health
```

---

## Post-Deployment Verification

After successful deployment, verify:

- [ ] **Frontend Loads**: `https://yourdomain.com` displays home page
- [ ] **Login Works**: Can register new account and login via UI
- [ ] **API Responds**: `curl https://yourdomain.com/api/health` returns 200
- [ ] **Database Persists**: Data survives container restart
- [ ] **SSL Valid**: Certificate is valid and not self-signed in production
- [ ] **No Errors in Logs**: `docker-compose logs` shows no ERROR level entries
- [ ] **Performance**: Page loads in < 3 seconds, API responds in < 500ms
- [ ] **Monitoring Active**: Health checks and logging are working

---

## Maintenance Tasks

### Weekly
- [ ] Check application logs for errors
- [ ] Monitor disk space for uploads directory
- [ ] Monitor database size and performance

### Monthly
- [ ] Review and update dependencies
- [ ] Check for security updates to base images
- [ ] Review access logs for suspicious activity
- [ ] Test backup restoration

### Quarterly
- [ ] Load test against production environment
- [ ] Run E2E tests against production
- [ ] Update base Docker images
- [ ] Security audit of configuration

---

## Emergency Contacts & Procedures

### If Production Is Down
1. [ ] Check `docker-compose -f docker-compose.prod.yml ps` to see which service failed
2. [ ] Check logs: `docker-compose -f docker-compose.prod.yml logs --tail=100`
3. [ ] Attempt automatic recovery: `docker-compose -f docker-compose.prod.yml restart <service>`
4. [ ] If restart fails, escalate to team lead
5. [ ] Activate incident response plan
6. [ ] Communicate status to users

### Escalation Contacts
- **DevOps Lead**: [contact info]
- **Backend Team Lead**: [contact info]
- **Database Admin**: [contact info]

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-XX | 1.0 | Initial production deployment checklist |
| | | Updated port configuration (5200 dev → 5000 prod) |
| | | Added nginx reverse proxy configuration |
| | | Added troubleshooting guide |

