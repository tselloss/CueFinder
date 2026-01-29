# Production Port Configuration Guide

## Overview
This guide explains how ports are configured for production deployment and how to properly set them up when deploying to production.

## Current Setup

### Development (Local)
- **Backend API**: `http://localhost:5200` (or port 5000)
- **Frontend**: `http://localhost:3000`
- **Moderator Service**: `http://localhost:5001`

### Production
- **Backend API**: `https://billiardscuefinder.com` (No port specified = uses 443 for HTTPS or 80 for HTTP)
- **Frontend**: `https://billiardscuefinder.com`
- **Moderator Service**: `http://cuefinder-moderator-prod:5001` (internal Docker network)

## How Port Configuration Works

### 1. Backend (CueFinderBE)

**Development** (`appsettings.Development.json`):
```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:5200"
      }
    }
  }
}
```

**Production** (`appsettings.Production.json`):
- Uses environment variables or Docker networking
- Typically runs behind a reverse proxy (nginx, Kubernetes ingress, etc.)
- Doesn't specify a port - the proxy handles the routing

### 2. Frontend (React)

**Development** (`.env.development`):
```env
REACT_APP_API_URL=http://localhost:5200
```

**Production** (`.env.production` or Docker build arg):
```dockerfile
ARG REACT_APP_API_URL=https://billiardscuefinder.com
```

### 3. Docker Compose (Production)

When deploying with `docker-compose.prod.yml`:
- Backend container exposes internal port (e.g., 5000)
- Nginx proxy listens on ports 80/443 and forwards to backend
- Frontend is served as static files through Nginx

## Deployment Steps

### Step 1: Update Backend Configuration

In `CueFinderBE/appsettings.Production.json`:
```json
{
  "CorsOrigins": {
    "Frontend": "https://yourdomain.com"
  },
  "ModerationServiceUrl": "http://cuefinder-moderator-prod:5001"
}
```

### Step 2: Update Frontend Build

When building the Docker image:
```bash
docker build \
  --build-arg REACT_APP_API_URL=https://yourdomain.com/api \
  -t cuefinderfe:prod .
```

Or in `docker-compose.prod.yml`:
```yaml
services:
  frontend:
    build:
      context: ./CueFinderFE/cuefinderfe
      args:
        REACT_APP_API_URL: https://billiardscuefinder.com/api
```

### Step 3: Configure Nginx Proxy

Use `nginx-ssl.conf` which:
- Listens on port 443 (HTTPS)
- Redirects HTTP (80) to HTTPS
- Forwards API requests to backend
- Serves frontend static files

Example configuration:
```nginx
server {
    listen 80;
    server_name billiardscuefinder.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name billiardscuefinder.com;
    
    # SSL certificates
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:5000/;
        # Headers, timeouts, etc.
    }
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }
}
```

## Port Mapping Reference

| Service | Dev Port | Prod Port | Notes |
|---------|----------|-----------|-------|
| Backend API | 5200 | 443/80 | Behind nginx proxy |
| Frontend Dev Server | 3000 | 443/80 | Served by nginx |
| Frontend Build | N/A | N/A | Static files via nginx |
| Moderator | 5001 | 5001 | Internal only |
| PostgreSQL | 5432 | 5432 | Internal only |
| Redis | 6379 | 6379 | Internal only |

## Environment Variables for Production

Create `.env` file on production server:

```bash
# Database
DB_HOST=postgres-prod
DB_PORT=5432
DB_NAME=cuefinder_prod
DB_USER=cuefinder
DB_PASSWORD=SECURE_PASSWORD

# JWT
JWT_SECRET=VERY_SECURE_SECRET_KEY

# Cors
CORS_FRONTEND_ORIGIN=https://billiardscuefinder.com

# File Storage
UPLOADS_PATH=/var/lib/cuefinder/uploads

# Email (if needed)
SMTP_SERVER=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=no-reply@cuefinder.com
SMTP_PASSWORD=EMAIL_PASSWORD
```

## How API Base URL is Determined

The frontend determines the API base URL in this order:

1. **Environment Variable** (`REACT_APP_API_URL`)
   - Set during Docker build
   - Example: `https://billiardscuefinder.com`

2. **Normalization** (in `src/config/apiConfig.js`)
   - If URL doesn't end with `/api`, it appends `/api`
   - Example: `https://billiardscuefinder.com` → `https://billiardscuefinder.com/api`

3. **Fallback** (dev default)
   - `http://localhost:5200/api`

## Testing Production Configuration

Before deploying, test the URL configuration:

```bash
# Build frontend with production API URL
cd CueFinderFE/cuefinderfe
npm run build -- --env REACT_APP_API_URL=https://yourdomain.com

# Run E2E tests against production-like setup
npm run test:e2e
```

## Common Issues & Solutions

### Issue: Frontend can't reach API
- **Cause**: Wrong `REACT_APP_API_URL` in build
- **Solution**: Verify Docker build arg or env file

### Issue: Mixed content (HTTPS to HTTP)
- **Cause**: Frontend on HTTPS but API URL is HTTP
- **Solution**: Ensure both use HTTPS in production

### Issue: CORS errors
- **Cause**: `CorsOrigins.Frontend` doesn't match deployment domain
- **Solution**: Update in `appsettings.Production.json`

### Issue: 502 Bad Gateway
- **Cause**: Nginx can't reach backend
- **Solution**: Check docker-compose networking and container names

## Deployment Checklist

- [ ] Update backend `appsettings.Production.json`
- [ ] Set `REACT_APP_API_URL` in Docker build or env
- [ ] Configure nginx proxy with SSL certificates
- [ ] Set all environment variables on production server
- [ ] Test API connectivity from deployed frontend
- [ ] Verify SSL certificate is valid
- [ ] Run E2E tests against production
- [ ] Monitor logs for any connection errors
