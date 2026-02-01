# Database Migrations & Deployment Fixes

## Overview

Database migrations in CueFinder are handled automatically by Entity Framework Core (`MigrateAsync()` in `DatabaseServiceExtension.cs`). This document describes the deployment setup and troubleshooting.

## Migration Files

### Core Database Migrations
Located in `SolutionLibraries/CueFinder.Database/Migrations/`:
- `20260103183000_InitialCreate` - Initial schema setup
- `20260104123551_AddPhoneVerification` - Phone verification columns
- `20260106134459_AddOAuthPropertiesToUser` - OAuth properties
- `20260106225418_AddImageDataToCueImage` - Image data columns
- `20260107135613_AddCueCaseTables` - CueCase tables
- `20260113091802_AddCueTypeColumn` - CueType column
- `20260121000000_AddModerationEntities` - Moderation tables
- `20260121132032_AddModerationToMainContent` - Moderation fields

### Forum Database Migrations
Located in `SolutionLibraries/CueFinder.Forum/Migrations/`:
- `20260115091110_InitialForumCreate` - Forum schema
- `20260116AddUsernameColumns` - Username columns
- `20260121132045_AddModerationToForumContent` - Forum moderation

## Deployment Process

### 1. Prerequisites
Before deploying to production:

```bash
# Set environment variables
export DB_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret"
export FRONTEND_API_URL="https://billiardscuefinder.com"
export CORS_FRONTEND_ORIGIN="https://billiardscuefinder.com"
export SMTP_PASSWORD="your-gmail-app-password"
```

### 2. Configure Passwordless Sudo (One-Time on Server)

The deployment process requires sudo without password prompts. Run this ONCE on the production server:

```bash
bash /home/cuefinder/app/deployment/fix-sudo-permissions.sh
```

This allows the CI/CD pipeline to execute Docker and deployment commands without password authentication.

### 3. Automatic Migration on Startup

When the backend container starts, it automatically:
1. Connects to PostgreSQL
2. Applies any pending EF Core migrations
3. Seeds initial data if needed

**No manual migration steps required** - migrations happen on app startup!

### 4. Manual Database Checks (if needed)

To manually verify database state:

```bash
# Connect to database
psql -h localhost -U postgres -d cuefinder

# Check applied migrations
SELECT * FROM "__EFMigrationsHistory" ORDER BY MigrationId DESC LIMIT 10;

# Check table count
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

## Troubleshooting

### Issue: Database Connection Fails
**Symptom:** Backend container exits with connection error

**Solution:**
```bash
# 1. Verify PostgreSQL is running
docker-compose ps | grep postgres

# 2. Check PostgreSQL logs
docker logs cuefinder-postgres-prod

# 3. Verify database password is set
echo $DB_PASSWORD

# 4. Manually test connection
psql -h localhost -U postgres -d cuefinder -c "SELECT 1"
```

### Issue: Migration Fails
**Symptom:** Backend logs show migration error

**Solution:**
```bash
# 1. Check backend logs
docker logs cuefinder-backend-blue-prod --tail 100

# 2. Check database structure
psql -h localhost -U postgres -d cuefinder -c "\dt"

# 3. Reset if corrupted (CAUTION - loses data)
# DROP DATABASE cuefinder;
# CREATE DATABASE cuefinder;
# Then restart backend container
```

### Issue: Deployment Timeout
**Symptom:** "Health check failed after 60s"

**Solution:**
- Increase retry count in deployment script
- Check server disk space: `df -h`
- Check memory: `docker stats`
- Check logs: `docker logs cuefinder-backend-blue-prod`

## Scripts

### `fix-sudo-permissions.sh`
Configures passwordless sudo for CI/CD deployments.
**Run once on production server by administrator**

```bash
sudo bash /home/cuefinder/app/deployment/fix-sudo-permissions.sh
```

### `db-migrations-init.sh`
Validates database connectivity and migration status.
**Diagnostic tool, not needed for normal deployments**

```bash
DB_PASSWORD=$DB_PASSWORD bash /home/cuefinder/app/deployment/db-migrations-init.sh
```

### `deploy-with-db-checks.sh`
Deploys with database health checks.
**Alternative deployment method with additional safeguards**

```bash
APP_DIR=/home/cuefinder/app bash /home/cuefinder/app/deployment/deploy-with-db-checks.sh
```

## Database Architecture

### Connection String
```
Host=postgres;
Port=5432;
Database=cuefinder;
Username=postgres;
Password=${DB_PASSWORD};
SslMode=Disable;
CommandTimeout=30
```

### Key Tables
- `Users` - User accounts and authentication
- `Cues` - Billiard cues
- `CueImages` - Cue photos
- `CueCases` - Cue cases/storage
- `BilliardTables` - Pool tables
- `Categories` - Forum categories
- `Topics` - Forum topics
- `ModerationQueue` - NSFW content for review
- `FlaggedImages` - User-flagged content

### Health Checks
- PostgreSQL: `pg_isready -U postgres -d cuefinder` (10s interval)
- Backend: `GET /health` (30s interval)

## Monitoring

### Check Migration Status
```bash
docker exec cuefinder-backend-blue-prod dotnet CueFinderBE.dll --check-migrations
```

### Monitor Migration Progress
```bash
docker logs -f cuefinder-backend-blue-prod | grep -i migration
```

### Database Disk Usage
```bash
docker exec cuefinder-postgres-prod du -sh /var/lib/postgresql/data
```

## Production Checklist

- [ ] Backup database before deployment
- [ ] Run `fix-sudo-permissions.sh` on server (one-time)
- [ ] Verify all environment variables are set in GitHub Secrets
- [ ] Test migrations in staging first
- [ ] Monitor backend logs during first 5 minutes after deployment
- [ ] Verify no data loss after migration
- [ ] Test all critical endpoints (login, cue listing, forums)

## Support

For migration issues, check:
1. Backend logs: `docker logs cuefinder-backend-blue-prod`
2. Database logs: `docker logs cuefinder-postgres-prod`
3. Git: Check migration files in `SolutionLibraries/CueFinder.Database/Migrations/`
4. EF Core docs: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/

## References

- Entity Framework Core Migrations: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/
- PostgreSQL Docker: https://hub.docker.com/_/postgres
- Blue-Green Deployment: See `deployment/deploy-backend-blue-green.sh`
