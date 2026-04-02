# Deployment Guide

Instructions for deploying CueFinder to various environments.

## Prerequisites

- Docker & Docker Compose
- PostgreSQL database access
- Domain name (for production)
- SSL certificates (for production)
- Git access to repository

## Deployment Environments

### Development (Local)

See [SETUP.md](SETUP.md) for local development setup.

### Staging (Docker Compose)

Run full stack locally with Docker:

```powershell
# Using development compose file
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

**Services Started**:
- PostgreSQL on `localhost:5432`
- Backend API on `localhost:5000`
- Frontend on `localhost:3000`

### Production

#### Architecture

```
┌─────────────────────────────────────────────┐
│          Load Balancer / CloudFlare         │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
┌───▼───────────┐       ┌─────────▼────────┐
│   Frontend    │       │     Backend      │
│  (App Platform)│       │  (App Platform)  │
│  Nginx + React│       │   ASP.NET Core   │
└───────────────┘       └──────────┬───────┘
                               │
                     ┌─────────▼─────────┐
                     │   PostgreSQL DB   │
                     │  (Managed DB)     │
                     └───────────────────┘
```

#### Deployment Steps

**1. Database Setup**

Create managed PostgreSQL database:
- Version: PostgreSQL 15
- Plan: Basic ($15/month minimum)
- Region: Select closest to users

Run migrations:
```powershell
# Get connection string from provider
$env:ConnectionStrings__DefaultConnection = "Host=db-host;Database=cuefinder;..."

# Run migrations
dotnet ef database update --project SolutionLibraries/CueFinder.Database
```

**2. Backend Deployment**

Build Docker image:
```powershell
# Build
docker build -t cuefinder-backend:latest -f CueFinderBE/Dockerfile .

# Test locally
docker run -p 5000:5000 -e ConnectionStrings__DefaultConnection="..." cuefinder-backend:latest

# Push to registry
docker tag cuefinder-backend:latest registry.digitalocean.com/cuefinder/backend:latest
docker push registry.digitalocean.com/cuefinder/backend:latest
```

**3. Frontend Deployment**

Build and deploy frontend:
```powershell
# Build
cd CueFinderFE
pnpm build

# Deploy static files to App Platform or Nginx
# Configure environment variables in deployment platform
```

**4. Environment Variables**

Backend (`appsettings.Production.json` or environment):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=prod-db;Database=cuefinder;Username=...;Password=..."
  },
  "JwtSettings": {
    "Secret": "SECURE-RANDOM-SECRET-MIN-32-CHARS",
    "Issuer": "CueFinder",
    "Audience": "CueFinderUsers",
    "ExpirationMinutes": 60
  },
  "GoogleAuth": {
    "ClientId": "production-google-client-id",
    "ClientSecret": "production-google-client-secret"
  },
  "AllowedOrigins": [
    "https://cuefinder.com",
    "https://www.cuefinder.com"
  ]
}
```

Frontend (`.env.production`):
```env
VITE_API_URL=https://api.cuefinder.com
VITE_APP_NAME=CueFinder
VITE_GOOGLE_CLIENT_ID=production-google-client-id
```

**5. SSL/TLS Configuration**

Using Let's Encrypt with Nginx:
```nginx
server {
    listen 443 ssl http2;
    server_name cuefinder.com www.cuefinder.com;

    ssl_certificate /etc/letsencrypt/live/cuefinder.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cuefinder.com/privkey.pem;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**6. Verify Deployment**

```powershell
# Health check
curl https://api.cuefinder.com/health

# Test API
curl https://api.cuefinder.com/api/raffles

# Check frontend
curl https://cuefinder.com
```

## Continuous Deployment (CI/CD)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: 8.0.x
      - name: Run tests
        run: dotnet test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        run: |
          docker build -t cuefinder-backend:${{ github.sha }} -f CueFinderBE/Dockerfile .
          docker push registry.digitalocean.com/cuefinder/backend:${{ github.sha }}
      - name: Deploy to App Platform
        run: |
          doctl apps update ${{ secrets.APP_ID }} --spec .do/app.yaml

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Install dependencies
        run: cd CueFinderFE && pnpm install
      - name: Build
        run: cd CueFinderFE && pnpm build
      - name: Deploy to App Platform
        run: |
          # Deploy static build to hosting
```

## Database Management

### Backup Strategy

**Automated Backups**:
- Daily backups at 2:00 AM UTC
- Retention: 7 days
- Point-in-time recovery: Last 7 days

**Manual Backup**:
```powershell
# Backup
pg_dump -h prod-db-host -U username -d cuefinder > backup-$(date +%Y%m%d).sql

# Restore
psql -h prod-db-host -U username -d cuefinder < backup-20260402.sql
```

### Migration Strategy

**Production Migration Process**:

1. **Test Locally**:
   ```powershell
   dotnet ef database update --project SolutionLibraries/CueFinder.Database
   ```

2. **Generate SQL Script**:
   ```powershell
   dotnet ef migrations script --project SolutionLibraries/CueFinder.Database --output migration.sql
   ```

3. **Review Script**: Check for:
   - Breaking changes
   - Data loss risks
   - Performance impact
   - Rollback plan

4. **Backup Production Database**:
   ```powershell
   pg_dump -h prod-db > pre-migration-backup.sql
   ```

5. **Schedule Maintenance Window**:
   - Notify users of downtime
   - Disable cron jobs
   - Stop application

6. **Apply Migration**:
   ```powershell
   psql -h prod-db -f migration.sql
   ```

7. **Verify Migration**:
   ```powershell
   # Check schema
   psql -h prod-db -c "\d raffles"
   
   # Test critical queries
   psql -h prod-db -c "SELECT COUNT(*) FROM raffles"
   ```

8. **Resume Application**:
   - Start application
   - Monitor logs
   - Test critical flows

9. **Rollback (if needed)**:
   ```powershell
   psql -h prod-db < pre-migration-backup.sql
   ```

## Monitoring

### Application Monitoring

**Logging**:
- Structured logging with Serilog
- Log aggregation (Seq, ELK, CloudWatch)
- Error tracking (Sentry)

**Metrics to Track**:
- Request rate
- Response time
- Error rate
- Database query performance
- Active users

### Database Monitoring

**Key Metrics**:
- Connection pool usage
- Query execution time
- Deadlocks
- Storage usage
- Index performance

**Tools**:
- pgAdmin for manual inspection
- pg_stat_statements for query analysis
- CloudWatch for AWS RDS
- DigitalOcean Insights for managed DB

### Alerts

Setup alerts for:
- API error rate > 5%
- Response time > 2 seconds
- Database CPU > 80%
- Disk usage > 85%
- Failed logins spike

## Scaling

### Horizontal Scaling

**Application Scaling**:
```yaml
# App Platform configuration
services:
  - name: backend
    instance_count: 3  # Scale to 3 instances
    instance_size: professional-xs
```

**Database Scaling**:
- Read replicas for queries
- Connection pooling (PgBouncer)
- Caching layer (Redis)

### Performance Optimization

**Backend**:
- Enable response compression
- Add output caching for static data
- Use database indexes
- Implement pagination

**Frontend**:
- Code splitting
- Lazy loading routes
- Image optimization
- CDN for static assets

## Rollback Strategy

### Application Rollback

```powershell
# Rollback to previous version
docker pull registry.digitalocean.com/cuefinder/backend:previous-sha
doctl apps update $APP_ID --image registry.digitalocean.com/cuefinder/backend:previous-sha
```

### Database Rollback

```powershell
# Restore from backup
psql -h prod-db < pre-deployment-backup.sql

# Revert migration
dotnet ef database update PreviousMigrationName --project SolutionLibraries/CueFinder.Database
```

## Security Checklist

Production deployment security:

- [ ] HTTPS enabled (TLS 1.2+)
- [ ] Environment variables secured (not in code)
- [ ] Database firewall rules configured
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled
- [ ] SQL injection protection (EF Core)
- [ ] XSS protection (React default escaping)
- [ ] CSRF tokens for state-changing operations
- [ ] Secrets rotation scheduled
- [ ] Regular security updates

## Troubleshooting

### Application Won't Start

Check:
1. Environment variables set correctly
2. Database connection string valid
3. Database migrations applied
4. Port not already in use
5. Docker container logs: `docker logs backend-container`

### Database Connection Issues

```powershell
# Test connection
psql -h db-host -U username -d cuefinder

# Check firewall rules
# Verify IP whitelist
# Check SSL requirements
```

### High CPU/Memory Usage

```powershell
# Check running queries
SELECT pid, query, state, query_start 
FROM pg_stat_activity 
WHERE state != 'idle';

# Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

Last Updated: April 2, 2026
