# Database Volume Management Guide

## ⚠️ CRITICAL: Database Preservation in Production

### The Problem with `docker-compose down -v`

When you run:
```bash
docker-compose down -v
```

The `-v` flag removes **ALL volumes**, including the PostgreSQL data volume. This:
- 🔴 **DELETES ALL USER DATA**
- 🔴 **Removes all listings, messages, forum posts**
- 🔴 **Should NEVER be used in production**

### Correct Development Usage

**For LOCAL DEVELOPMENT** (when you want a fresh database):
```bash
docker-compose down -v          # ✅ OK in dev - removes all data
docker-compose up -d --build    # Rebuilds with empty database
```

**For DEVELOPMENT** (when you want to keep data):
```bash
docker-compose down             # ✅ Stops containers WITHOUT deleting volumes
docker-compose up -d --build    # Rebuilds and restarts - data is preserved
```

**For PRODUCTION** (always use this):
```bash
docker-compose down             # ✅ NEVER use -v flag
docker-compose up -d --build    # Restarts services, keeps all data
```

---

## Database Volume Location

Your PostgreSQL data is stored in:
```
Docker Volume: cuefinder_postgres_data
Host Location: /var/lib/docker/volumes/cuefinder_postgres_data/_data
```

Check volumes with:
```bash
docker volume ls
```

---

## Backup Strategy for Production

### 1. Before Major Updates
```bash
# Backup the database
docker-compose exec postgres pg_dump -U postgres cuefinder > backup-$(date +%Y%m%d-%H%M%S).sql

# Keep backup file safe
cp backup-*.sql /secure/backup/location/
```

### 2. Database Migrations
The app uses **Entity Framework Migrations** which:
- ✅ Automatically apply pending migrations on startup
- ✅ Never drop tables (safe incremental schema changes)
- ✅ Preserve all user data

Check migration status:
```bash
docker-compose exec backend dotnet ef migrations list
```

### 3. Restore from Backup
```bash
# If data is lost:
cat backup-YYYYMMDD-HHMMSS.sql | docker-compose exec -T postgres psql -U postgres cuefinder
```

---

## Safe Docker-Compose Commands

### Development with Data Preservation
```bash
# Stop without deleting data
docker-compose down

# Rebuild frontend only
docker-compose up -d --build frontend

# Rebuild backend only
docker-compose up -d --build backend

# Restart everything
docker-compose up -d --build
```

### Development - Fresh Start (Lost Data)
```bash
# Only use when you WANT to lose all data
docker-compose down -v
docker-compose up -d --build
```

### Production Deployment
```bash
# NEVER use -v flag
docker-compose down
docker-compose up -d --build

# Verify migration completed
docker-compose logs backend | grep -i "migrat"
```

---

## Checklist for Production Safety

- [ ] **NEVER use `docker-compose down -v` in production**
- [ ] Always backup before major updates: `docker-compose exec postgres pg_dump -U postgres cuefinder > backup.sql`
- [ ] Test migrations locally first: `docker-compose up -d --build`
- [ ] Verify no data loss: `docker-compose exec postgres psql -U postgres -d cuefinder -c "SELECT COUNT(*) FROM users;"`
- [ ] Keep backups in secure location (S3, cloud storage, etc.)
- [ ] Document all manual database changes
- [ ] Use migrations for all schema changes (never direct SQL in production)

---

## Current Database Status

**Volume Name:** `cuefinder_postgres_data`  
**Database:** `cuefinder`  
**User:** `postgres`  
**Port:** `5432` (internal), `5432` (exposed)  
**Connection:** `postgres://postgres:admin@cuefinder-postgres:5432/cuefinder`

---

## Troubleshooting

### Users missing after rebuild?
```bash
# Check if volume still exists
docker volume ls | grep postgres

# If volume exists, data should be there
# Restart and verify
docker-compose up -d
docker-compose exec postgres psql -U postgres -d cuefinder -c "SELECT COUNT(*) FROM users;"
```

### Force migrate database
```bash
docker-compose down
docker-compose up -d postgres
docker-compose up backend  # Watch logs for migrations
```

### View database contents
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d cuefinder

# Common queries:
\dt                           # List all tables
SELECT COUNT(*) FROM users;   # Count users
\q                            # Quit
```
