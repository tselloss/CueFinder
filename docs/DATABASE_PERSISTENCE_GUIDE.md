# Database Persistence Guide - Docker Rebuild

## Πρόβλημα (Problem)
Κάθε φορά που κάνετε Docker rebuild χάνονται τα δεδομένα της βάσης δεδομένων.
Every time you rebuild Docker, the database loses its data.

## Αιτία (Root Cause)
```bash
docker-compose down -v  # ❌ The "-v" flag REMOVES all volumes!
```

The `-v` flag deletes Docker volumes, which contain the PostgreSQL database data.

## Λύση (Solution)

### ✅ ΣΩΣΤΑ (CORRECT) - Preserve Database Data

#### Option 1: Clean rebuild WITHOUT removing volumes
```bash
# Stops containers but keeps volumes (data persists)
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

#### Option 2: Selective volume cleanup
```bash
# Remove only backend/frontend containers, keep database
docker-compose down
docker volume rm cuefinder_postgres_data  # Only if you want to reset DB

# Rebuild
docker-compose up -d --build
```

#### Option 3: View all volumes before removing
```bash
# List all volumes
docker volume ls

# See which volumes belong to CueFinder
docker volume ls | grep cuefinder

# Remove specific volume if needed
docker volume rm cuefinder_postgres_data
```

### ❌ ΛΑΘΑ (INCORRECT) - Data Loss
```bash
docker-compose down -v  # This removes ALL volumes including database!
```

## Production Deployment Safety

### For Production (NEVER use -v):
```bash
# Update image only
docker-compose pull
docker-compose up -d

# Or rebuild frontend only (backend usually doesn't change)
docker-compose up -d --build frontend
```

### Database Backup Before Major Operations:
```bash
# Backup PostgreSQL database
docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
docker exec -i cuefinder-postgres psql -U postgres -d cuefinder < backup_20260130_120000.sql
```

## Docker Compose Configuration - Current Setup

```yaml
services:
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ← Database data persisted here

volumes:
  postgres_data:
    driver: local  # Stored on your local machine
  pgadmin_data:
    driver: local
  opennsfw_cache:
    driver: local
```

### Volume Location on Your Machine:
- **Windows (WSL2)**: `\\wsl$\docker-desktop\mnt\wsl\instances\docker-desktop\...`
- **Windows (Docker Desktop)**: Managed by Docker Desktop VM
- **Linux**: `/var/lib/docker/volumes/cuefinder_postgres_data/_data/`
- **Mac**: Managed by Docker Desktop VM

## Quick Reference Commands

| Command | Effect | Data |
|---------|--------|------|
| `docker-compose stop` | Pauses containers | ✅ Preserved |
| `docker-compose down` | Removes containers | ✅ Preserved |
| `docker-compose down -v` | **Removes containers AND volumes** | ❌ **DELETED** |
| `docker volume rm <name>` | Removes specific volume | ❌ **DELETED** |
| `docker system prune -a` | **Removes all unused volumes** | ❌ **DELETED** |
| `docker system prune -a -v` | **Removes all volumes** | ❌ **DELETED** |

## If You Accidentally Deleted Data

Unfortunately, once Docker volumes are removed, the data is permanently deleted. However:

1. **If you have a backup**: Restore from backup
2. **If this is development**: Re-seed sample data
3. **If this is production**: Restore from external backups (stored outside Docker)

## Recommended Workflow

### For Development:
```bash
# Daily workflow - preserves data
docker-compose down          # Stop containers
# ... make code changes ...
docker-compose up -d --build # Rebuild and restart - data persists
```

### For Fresh Start (when needed):
```bash
# Only when you INTENTIONALLY want to reset database
docker-compose down
docker volume rm cuefinder_postgres_data  # Explicit removal
docker-compose up -d --build              # Creates new empty database
```

### For Production:
```bash
# NEVER use "-v" flag in production!
# Update backend/frontend only
docker-compose up -d --build frontend

# Or with new images
docker-compose pull
docker-compose up -d
```

## Environment-Specific Safety

### Development (Your Machine)
```bash
docker-compose -f docker-compose.yml down          # Safe - keeps data
docker-compose -f docker-compose.yml up -d --build # Rebuild with data
```

### Staging/Testing
```bash
# Same as development
# Volumes preserved automatically
```

### Production (MOST CRITICAL)
```bash
# CRITICAL: NEVER use -v flag!

# Safe update:
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Or rebuild specific services:
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

## Testing Database Persistence

```bash
# Check current data
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "SELECT COUNT(*) FROM users;"

# Stop and restart
docker-compose down
docker-compose up -d

# Check data again - should be the same!
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "SELECT COUNT(*) FROM users;"
```

## Summary

✅ **Safe for data:**
- `docker-compose down`
- `docker-compose up -d --build`
- `docker-compose restart`
- `docker-compose pull && docker-compose up -d`

❌ **Deletes data (DANGEROUS):**
- `docker-compose down -v`
- `docker volume rm <volume_name>`
- `docker system prune -a`
- `docker system prune -a -v`

---

**Remember**: Always use `docker-compose down` (without `-v`) in development and production!
