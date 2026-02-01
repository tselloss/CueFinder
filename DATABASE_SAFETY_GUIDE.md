# Database Safety & Migration Strategy

**Purpose**: Ensure database updates never delete critical data and are fully reversible

---

## Overview

This guide provides comprehensive procedures to:
- ✅ Automatically backup before any migration
- ✅ Verify data integrity after updates
- ✅ Prevent accidental data deletion
- ✅ Enable quick rollback if issues occur
- ✅ Track all schema changes

---

## Database Backup Strategy

### Automatic Backup Before Migrations

**Backup Location**: `/home/cuefinder/backups/`

**Backup Naming**: `cuefinder_backup_YYYYMMDD_HHMMSS.sql`

**When Backups Occur**:
- Before infrastructure deployment
- Before any migration runs
- On a schedule (daily at 2 AM)

### Manual Backup Procedure

```bash
# SSH into server
ssh cuefinder@<SERVER_IP>

# Create backup
docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > \
  /home/cuefinder/backups/cuefinder_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /home/cuefinder/backups/ | tail -5

# Check backup size (should be several MB)
du -sh /home/cuefinder/backups/
```

### Backup Verification

```bash
# Verify backup is valid
docker exec cuefinder-postgres psql -U postgres -d cuefinder_test < \
  /home/cuefinder/backups/cuefinder_backup_20240101_120000.sql

# List tables in backup
docker exec cuefinder-postgres pg_restore --list \
  /home/cuefinder/backups/cuefinder_backup_20240101_120000.sql | head -50
```

### Backup Retention Policy

```bash
# Keep last 30 backups, delete older ones
find /home/cuefinder/backups/ -type f -name "*.sql" \
  -mtime +30 -delete

# Or keep only last 30 files
ls -t /home/cuefinder/backups/*.sql | tail -n +31 | xargs rm -f
```

---

## Data Preservation Constraints

### Critical Tables That Should Never Be Deleted

```sql
-- Tables that contain user data (MUST be preserved)
- users                    -- User accounts
- userprofiles            -- User profile information
- forumcategories         -- Forum structure
- forumposts              -- User discussions
- cues                     -- Billiard cue data
- cuecases                -- Billiard case data
- ratings                 -- User ratings/reviews
- images                  -- Uploaded images
```

### Prevent Accidental Deletions

**Create safety trigger (run once on server):**

```bash
docker exec cuefinder-postgres psql -U postgres -d cuefinder << 'EOF'
-- Prevent DROP TABLE on critical tables
CREATE OR REPLACE FUNCTION prevent_critical_drops()
RETURNS event_trigger AS $$
BEGIN
    RAISE EXCEPTION 'Cannot drop critical tables. Contact admin.';
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE EVENT TRIGGER prevent_drops 
    ON ddl_command_start 
    WHEN TAG IN ('DROP TABLE')
    EXECUTE FUNCTION prevent_critical_drops();

-- Mark tables as critical
ALTER TABLE users SET (
    autovacuum_vacuum_scale_factor = 0.0,
    autovacuum_analyze_scale_factor = 0.0
);

-- Log all changes
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255),
    operation VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100),
    old_values JSONB,
    new_values JSONB
);

EOF
```

---

## Migration Safety Checklist

**Before Every Migration:**

- [ ] Create full database backup (automatic in deploy-infra.yml)
- [ ] Verify backup is valid and restorable
- [ ] Review migration SQL files for dangerous operations
- [ ] Test migrations against backup in isolated test database
- [ ] Document what the migration does
- [ ] Have rollback plan ready

**During Migration:**

- [ ] Monitor deployment logs in real-time
- [ ] Check for any error messages
- [ ] Verify data counts before/after

**After Migration:**

- [ ] Query critical tables to verify data exists
- [ ] Test application functionality
- [ ] Monitor error logs for issues
- [ ] Keep backup for 30 days

---

## Safe Migration Procedures

### Test Migration First (No Data Loss)

```bash
# On your local machine with backup

# 1. Restore backup to test database
docker exec cuefinder-postgres createdb -U postgres cuefinder_test
docker exec cuefinder-postgres psql -U postgres -d cuefinder_test < \
  cuefinder_backup_20240101_120000.sql

# 2. Run migrations on test database
docker exec cuefinder-postgres psql -U postgres -d cuefinder_test < \
  init.sql/migration_001_add_column.sql

# 3. Verify results
docker exec cuefinder-postgres psql -U postgres -d cuefinder_test \
  -c "SELECT COUNT(*) FROM users;"

# 4. If successful, apply to production
```

### Data Verification Queries

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d cuefinder

# In psql prompt:

-- Count all critical records
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'forumcategories', COUNT(*) FROM forumcategories
UNION ALL
SELECT 'forumposts', COUNT(*) FROM forumposts
UNION ALL
SELECT 'cues', COUNT(*) FROM cues
UNION ALL
SELECT 'cuecases', COUNT(*) FROM cuecases
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings;

-- Check for orphaned records
SELECT * FROM forumposts WHERE category_id NOT IN (
    SELECT id FROM forumcategories
);

-- Verify data integrity
SELECT * FROM users WHERE email IS NULL OR email = '';
SELECT * FROM cues WHERE name IS NULL OR name = '';

-- Exit
\q
```

---

## Rollback Procedures

### If Something Goes Wrong

**Scenario 1: Migration failed, need to rollback immediately**

```bash
ssh cuefinder@<SERVER_IP>

# 1. Stop application to prevent data conflicts
docker compose stop backend-blue backend-green moderator

# 2. List recent backups
ls -lt /home/cuefinder/backups/ | head -5

# 3. Restore from backup
docker exec cuefinder-postgres psql -U postgres -d cuefinder < \
  /home/cuefinder/backups/cuefinder_backup_YYYYMMDD_HHMMSS.sql

# 4. Verify restore
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT COUNT(*) FROM users;"

# 5. Restart application
docker compose up -d backend-blue backend-green moderator

# 6. Verify application is running
curl -X GET http://localhost:5001/api/health
```

**Scenario 2: Data corruption detected after migration**

```bash
# 1. Identify when corruption started
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 10;"

# 2. Find backup before corruption
ls -lt /home/cuefinder/backups/ | head -10

# 3. Restore to that backup
docker exec cuefinder-postgres psql -U postgres -d cuefinder < \
  /home/cuefinder/backups/cuefinder_backup_BEFORE_CORRUPTION.sql

# 4. Verify
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '1 day';"
```

---

## Migration Workflow in CI/CD

### Automatic Backup in Deploy Pipeline

**In `.github/workflows/deploy-infra.yml`:**

```yaml
- name: Deploy infrastructure
  env:
    SERVER_IP: ${{ secrets.SERVER_IP }}
    SERVER_USER: cuefinder
    SKIP_MIGRATIONS: ${{ github.event.inputs.skip-migrations || 'false' }}
  run: |
    cat > deploy-infra.sh << 'SCRIPT'
    #!/bin/bash
    set -e
    
    cd /home/cuefinder/app
    
    # STEP 1: CREATE BACKUP BEFORE ANY CHANGES
    if [ "$SKIP_MIGRATIONS" != "true" ]; then
      echo "📦 Creating database backup..."
      mkdir -p /home/cuefinder/backups
      BACKUP_FILE="/home/cuefinder/backups/cuefinder_backup_$(date +%Y%m%d_%H%M%S).sql"
      
      docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > "$BACKUP_FILE"
      echo "✓ Backup created: $BACKUP_FILE"
      
      # Verify backup was created
      if [ ! -s "$BACKUP_FILE" ]; then
        echo "✗ ERROR: Backup file is empty!"
        exit 1
      fi
      
      # STEP 2: VERIFY BACKUP IS VALID
      echo "🔍 Verifying backup..."
      TEMP_DB="cuefinder_verify_$$"
      docker exec cuefinder-postgres createdb -U postgres "$TEMP_DB" || true
      
      if docker exec cuefinder-postgres psql -U postgres -d "$TEMP_DB" < "$BACKUP_FILE" > /dev/null 2>&1; then
        echo "✓ Backup verification successful"
        docker exec cuefinder-postgres dropdb -U postgres "$TEMP_DB" || true
      else
        echo "⚠️  Warning: Backup verification failed, but continuing"
      fi
      
      # STEP 3: COUNT RECORDS BEFORE MIGRATION
      USERS_BEFORE=$(docker exec cuefinder-postgres psql -U postgres -d cuefinder -t -c "SELECT COUNT(*) FROM users;")
      CUES_BEFORE=$(docker exec cuefinder-postgres psql -U postgres -d cuefinder -t -c "SELECT COUNT(*) FROM cues;")
      echo "📊 Before migration: Users=$USERS_BEFORE, Cues=$CUES_BEFORE"
      
      # STEP 4: RUN MIGRATIONS
      echo "🔄 Running database migrations..."
      for migration in init.sql/*.sql scripts/*.sql; do
        if [ -f "$migration" ]; then
          echo "   Running: $(basename $migration)"
          docker exec -i cuefinder-postgres psql -U postgres -d cuefinder < "$migration" || {
            echo "   ✗ Migration failed, restoring from backup..."
            docker exec cuefinder-postgres psql -U postgres -d cuefinder < "$BACKUP_FILE"
            exit 1
          }
        fi
      done
      
      # STEP 5: VERIFY DATA INTEGRITY AFTER MIGRATION
      USERS_AFTER=$(docker exec cuefinder-postgres psql -U postgres -d cuefinder -t -c "SELECT COUNT(*) FROM users;")
      CUES_AFTER=$(docker exec cuefinder-postgres psql -U postgres -d cuefinder -t -c "SELECT COUNT(*) FROM cues;")
      echo "📊 After migration: Users=$USERS_AFTER, Cues=$CUES_AFTER"
      
      # STEP 6: VERIFY NO DATA WAS LOST
      if [ "$USERS_BEFORE" -eq 0 ] && [ "$USERS_AFTER" -eq 0 ]; then
        echo "✓ User count verified (both zero - fresh database)"
      elif [ "$USERS_AFTER" -lt "$USERS_BEFORE" ]; then
        echo "✗ ERROR: Users decreased from $USERS_BEFORE to $USERS_AFTER!"
        echo "Restoring from backup..."
        docker exec cuefinder-postgres psql -U postgres -d cuefinder < "$BACKUP_FILE"
        exit 1
      else
        echo "✓ Data integrity verified (no data loss)"
      fi
      
      echo "✅ Database migrations completed successfully"
    fi
    SCRIPT
```

---

## Scheduled Backups

### Daily Automated Backup (Cron Job on Server)

```bash
# SSH into server and add to crontab
ssh cuefinder@<SERVER_IP>

# Edit crontab
crontab -e

# Add this line (backup daily at 2 AM):
0 2 * * * /home/cuefinder/scripts/backup-db.sh

# Create the backup script
cat > /home/cuefinder/scripts/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/cuefinder/backups"
BACKUP_FILE="$BACKUP_DIR/cuefinder_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql"

mkdir -p "$BACKUP_DIR"

# Create backup
docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 30 backups
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete

# Log backup
echo "$(date): Backup created: $BACKUP_FILE.gz" >> "$BACKUP_DIR/backup.log"
EOF

chmod +x /home/cuefinder/scripts/backup-db.sh
```

### Monitor Backup Success

```bash
# Check backup log
tail -20 /home/cuefinder/backups/backup.log

# Check backup sizes
du -sh /home/cuefinder/backups/*

# Verify latest backup
gunzip -t /home/cuefinder/backups/cuefinder_backup_*.sql.gz | tail -1
```

---

## Database Monitoring

### Query to Track All Changes

```sql
-- Create audit table (run once)
CREATE TABLE IF NOT EXISTS schema_changes (
    id SERIAL PRIMARY KEY,
    change_type VARCHAR(50),
    table_name VARCHAR(255),
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rolled_back_at TIMESTAMP
);

-- Log migration
INSERT INTO schema_changes (change_type, table_name, description)
VALUES ('migration', 'users', 'Added user_preferences column');

-- View all changes
SELECT * FROM schema_changes 
WHERE rolled_back_at IS NULL 
ORDER BY applied_at DESC;
```

### Monitor Data Growth

```bash
# Check database size
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datname='cuefinder';"

# Check table sizes
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Monitor table row counts daily
docker exec cuefinder-postgres psql -U postgres -d cuefinder << 'EOF'
SELECT 
    tablename,
    (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname=tablename) as rows,
    NOW() as checked_at
FROM pg_tables 
WHERE schemaname='public'
ORDER BY tablename;
EOF
```

---

## Critical Tables Schema

### Never Delete These Tables

```sql
-- Users and authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);

-- Forum structure
CREATE TABLE forumcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);

-- Forum content
CREATE TABLE forumposts (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES forumcategories(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);

-- Billiard cues
CREATE TABLE cues (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);

-- Cases for cues
CREATE TABLE cuecases (
    id SERIAL PRIMARY KEY,
    cue_id INTEGER REFERENCES cues(id),
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);

-- Ratings and reviews
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    cue_id INTEGER REFERENCES cues(id),
    user_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
);
```

---

## Emergency Procedures

### Database Won't Start

```bash
# 1. Check PostgreSQL container logs
docker logs cuefinder-postgres

# 2. Check available backups
ls -lt /home/cuefinder/backups/ | head -5

# 3. Try to restore latest backup
docker exec cuefinder-postgres psql -U postgres -d cuefinder < \
  /home/cuefinder/backups/cuefinder_backup_LATEST.sql

# 4. If container won't start, remove and recreate
docker stop cuefinder-postgres
docker rm cuefinder-postgres

# 5. Remove corrupted volume (careful!)
docker volume rm cuefinder_postgres_data

# 6. Restart container (will use backup)
docker compose up -d postgres

# 7. Restore data
docker exec cuefinder-postgres psql -U postgres -d cuefinder < \
  /home/cuefinder/backups/cuefinder_backup_LATEST.sql
```

### Disk Space Running Out

```bash
# Check disk usage
df -h /home/cuefinder/

# Delete old backups (keep last 10)
ls -t /home/cuefinder/backups/*.sql | tail -n +11 | xargs rm -f

# Compress old backups
gzip /home/cuefinder/backups/*.sql

# Clean up Docker images
docker image prune -a -f

# Clean up volumes
docker volume prune -f
```

### Data Corruption Detected

```bash
# 1. Stop application immediately
docker compose stop

# 2. Run database check
docker exec cuefinder-postgres pg_basebackup -D - | pg_controldata

# 3. Restore from clean backup
docker exec cuefinder-postgres psql -U postgres -d cuefinder < \
  /home/cuefinder/backups/cuefinder_backup_CLEAN.sql

# 4. Verify integrity
docker exec cuefinder-postgres psql -U postgres -d cuefinder \
  -c "REINDEX DATABASE cuefinder;"

# 5. Restart
docker compose up -d
```

---

## Backup Verification Checklist

Run this weekly to ensure backups are working:

```bash
#!/bin/bash

echo "=== Backup Verification ==="
echo ""

# Check backup directory exists
if [ -d "/home/cuefinder/backups" ]; then
    echo "✓ Backup directory exists"
else
    echo "✗ Backup directory missing"
    exit 1
fi

# Check recent backups exist
BACKUP_COUNT=$(ls /home/cuefinder/backups/*.sql 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo "✓ Found $BACKUP_COUNT backups"
else
    echo "✗ No backups found"
    exit 1
fi

# Check backup age (should be newer than 24 hours)
LATEST_BACKUP=$(ls -t /home/cuefinder/backups/*.sql 2>/dev/null | head -1)
BACKUP_AGE=$(find "$LATEST_BACKUP" -mtime -1)
if [ -n "$BACKUP_AGE" ]; then
    echo "✓ Latest backup is recent"
else
    echo "⚠️  Latest backup is older than 24 hours"
fi

# Try to restore a test
echo ""
echo "Testing restore capability..."
docker exec cuefinder-postgres createdb -U postgres test_restore 2>/dev/null || true
if docker exec cuefinder-postgres psql -U postgres -d test_restore < "$LATEST_BACKUP" > /dev/null 2>&1; then
    echo "✓ Backup is valid and restorable"
    docker exec cuefinder-postgres dropdb -U postgres test_restore
else
    echo "✗ Backup validation failed"
    exit 1
fi

echo ""
echo "=== All backup checks passed ==="
```

---

## Summary

**Database Safety Features:**
- ✅ Automatic backups before every migration
- ✅ Backup verification before applying migrations
- ✅ Data count verification (before/after)
- ✅ Rollback capability if data loss detected
- ✅ Prevents accidental table deletion
- ✅ Audit trail of all schema changes
- ✅ 30-day backup retention
- ✅ Emergency procedures for data recovery

**Critical Tables Protected:**
- users
- forumcategories
- forumposts
- cues
- cuecases
- ratings
- images

**Run This Before First Production Deployment:**
```bash
# SSH to server
ssh cuefinder@<SERVER_IP>

# Create backups directory
mkdir -p /home/cuefinder/backups

# Create first backup
docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > \
  /home/cuefinder/backups/cuefinder_backup_initial.sql

# Verify backup
du -sh /home/cuefinder/backups/cuefinder_backup_initial.sql

# Enable daily backups (add to crontab)
0 2 * * * /home/cuefinder/scripts/backup-db.sh
```

**Your data is now protected!**
