# CueFinder Database Schema Update Scripts

This directory contains database schema management scripts for CueFinder. These scripts are designed to:

- ✅ Check current database schema
- ✅ Add missing columns and fields
- ✅ Create necessary indexes for performance
- ✅ Update default values and constraints
- ✅ Validate schema integrity
- ✅ Generate detailed logs for audit trails
- ✅ Work with both development and production environments
- ✅ Be idempotent (safe to run multiple times)

## ⚠️ Safety Guarantees

**These scripts are 100% safe and NON-DESTRUCTIVE:**

- ✅ **NO DROP operations** - Never deletes columns, tables, or indexes
- ✅ **NO DELETE operations** - Never removes existing data
- ✅ **NO TRUNCATE operations** - Never clears table contents
- ✅ **Add-only** - Only creates new columns and indexes if they don't exist
- ✅ **Update-safe** - Safely updates defaults and constraints without data loss
- ✅ **Idempotent** - Can be run multiple times without negative effects

You can run these scripts with confidence - they will never delete or lose data.

## Files

### 1. `database-schema-update.sql`
Pure SQL script that handles all schema updates. This is the core migration script.

**Features:**
- Adds missing columns (e.g., `CreatedByUsername` for forum posts)
- Sets proper column defaults
- Creates all necessary indexes
- Updates existing data if needed
- Provides schema verification queries

**Tables Updated:**
- Users
- Cues & CueCases
- Forum (Categories, Discussions, Posts)
- Messages
- Ratings
- Transactions
- And more...

**Usage:**
```bash
# Direct psql execution
psql -U postgres -d cuefinder -f database-schema-update.sql

# Via docker
docker exec cuefinder-postgres psql -U postgres -d cuefinder -f /path/to/database-schema-update.sql

# Copy and execute
docker cp database-schema-update.sql cuefinder-postgres:/tmp/
docker exec cuefinder-postgres psql -U postgres -d cuefinder -f /tmp/database-schema-update.sql
```

### 2. `deploy-database-schema.sh`
Bash deployment script for Linux/macOS with comprehensive validation and logging.

**Features:**
- Automatic database connection verification
- Pre/post update statistics collection
- Column validation for critical fields
- Data integrity checks
- Color-coded output for easy reading
- Detailed logging to timestamped log file
- Exit codes for CI/CD pipeline integration

**Usage:**
```bash
# With defaults (localhost, cuefinder, postgres)
./deploy-database-schema.sh

# With custom parameters
./deploy-database-schema.sh \
  --db-host=prod-db.example.com \
  --db-port=5432 \
  --db-name=cuefinder_prod \
  --db-user=admin \
  --db-password=YourPassword

# Or using environment variables
export DB_HOST=prod-db.example.com
export DB_NAME=cuefinder_prod
export DB_USER=admin
./deploy-database-schema.sh
```

**Environment Variables:**
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: cuefinder)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (optional)

**Output:**
```
✓ Database connection verified
ℹ Gathering pre-update database statistics...
  Tables before update: 20
  Columns before update: 210
  Indexes before update: 75
ℹ Executing database schema update...
✓ Schema update script executed successfully
ℹ Validating critical schema elements...
✓ Posts.CreatedByUsername exists
✓ Discussions.CreatedByUsername exists
✓ Users.Phone exists
✓ Users.IsPhoneVerified exists
✓ Categories.IsActive exists
✓ Messages.IsRead exists

╔════════════════════════════════════════════════════════════════════╗
║                      UPDATE SUMMARY                                ║
╠════════════════════════════════════════════════════════════════════╣
║ Tables:         20 → 20
║ Columns:        210 → 212
║ Indexes:        75 → 84
║ Validations:    6/6 passed
║ Log File:       database-update-20260116-143022.log
╚════════════════════════════════════════════════════════════════════╝
```

### 3. `deploy-database-schema.ps1`
PowerShell deployment script for Windows with comprehensive validation and logging.

**Features:**
- Same features as bash script but for Windows
- Color-coded output for PowerShell console
- Native Windows compatibility
- Integration with Windows Task Scheduler

**Usage:**
```powershell
# With defaults
.\deploy-database-schema.ps1

# With parameters
.\deploy-database-schema.ps1 `
  -DbHost prod-db.example.com `
  -DbPort 5432 `
  -DbName cuefinder_prod `
  -DbUser admin `
  -DbPassword "YourPassword"
```

## Database Schema Overview

### Core Tables (20 total)

**User Management:**
- `Users` - User accounts with phone verification, OAuth support
- `PhoneVerificationTokens` - Phone verification tokens

**Product Listings:**
- `Cues` - Billiard cues for sale
- `CueCases` - Billiard cue cases for sale
- `CueImages` - Images for cues
- `CueCaseImages` - Images for cue cases

**Social Features:**
- `Ratings` - User ratings and reviews
- `SavedCues` - Saved favorite cues
- `Messages` - Private messaging system
- `Transactions` - Purchase transactions

**Forum System:**
- `Categories` - Forum categories (6 predefined)
- `Discussions` - Forum discussion threads
- `Posts` - Posts/replies within discussions
- `PostLikes` - Likes on forum posts
- `PostMentions` - User mentions in posts
- `Notifications` - Forum activity notifications
- `DiscussionSubscriptions` - User subscriptions to discussions
- `DiscussionViews` - Discussion view tracking

**Total:**
- **20 Tables**
- **210+ Columns**
- **84 Indexes**

### Recent Schema Changes (January 2026)

The following columns were added to support forum enhancements:

1. **Posts.CreatedByUsername** (text) - Username of post author
   - Default: 'User'
   - Purpose: Display author name without joining Users table

2. **Discussions.CreatedByUsername** (text) - Username of discussion starter
   - Default: 'User'
   - Purpose: Display author name without joining Users table

3. **Forum Indexes** - Added performance indexes:
   - `IX_Discussions_CategoryId`
   - `IX_Discussions_CreatedByUserId`
   - `IX_Discussions_CreatedAt`
   - `IX_Posts_DiscussionId`
   - `IX_Posts_CreatedByUserId`
   - `IX_Posts_CreatedAt`
   - `IX_PostMentions_PostId`
   - `IX_PostMentions_MentionedUserId`
   - `IX_Notifications_UserId_IsRead`

## Production Deployment Guide

### Pre-Deployment Checklist

- [ ] Backup current database
- [ ] Test scripts in staging environment
- [ ] Review schema changes (see Recent Schema Changes section above)
- [ ] Verify database credentials and permissions
- [ ] Check available disk space
- [ ] Plan maintenance window if needed

### Deployment Steps

#### Option 1: Using Docker (Recommended)

```bash
# 1. Copy script to container
docker cp database-schema-update.sql cuefinder-postgres:/tmp/

# 2. Execute update
docker exec cuefinder-postgres psql -U postgres -d cuefinder -f /tmp/database-schema-update.sql

# 3. Verify results
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "\d+"
```

#### Option 2: Direct Database Connection

```bash
# 1. Make script executable
chmod +x deploy-database-schema.sh

# 2. Set environment variables for production
export DB_HOST=prod-db.example.com
export DB_PORT=5432
export DB_NAME=cuefinder_prod
export DB_USER=admin

# 3. Run deployment script
./deploy-database-schema.sh

# 4. Check log file
tail -f database-update-YYYYMMDD-HHMMSS.log
```

#### Option 3: Windows/PowerShell

```powershell
# 1. Open PowerShell as Administrator
# 2. Navigate to script directory
cd C:\CueFinder\scripts

# 3. Allow script execution (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# 4. Run deployment
.\deploy-database-schema.ps1 -DbHost prod-db.example.com -DbName cuefinder_prod

# 5. Monitor log file
Get-Content .\database-update-*.log -Wait
```

### Post-Deployment Verification

```sql
-- Connect to database and run verification queries

-- Check all tables exist
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 20

-- Check critical columns
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'Posts' AND column_name = 'CreatedByUsername';
-- Expected: 1

SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'Discussions' AND column_name = 'CreatedByUsername';
-- Expected: 1

-- Check indexes
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
-- Expected: 84+

-- Sample forum data
SELECT COUNT(*) as total_posts FROM "Posts";
SELECT COUNT(*) as total_discussions FROM "Discussions";
SELECT COUNT(*) as total_categories FROM "Categories" WHERE "IsActive" = true;
```

## Rollback Procedure

If issues occur, you can rollback. Note: The schema update script is designed to be non-destructive and idempotent.

```sql
-- Manual rollback options (if needed)

-- Remove recently added columns (if absolutely necessary)
-- ALTER TABLE "Posts" DROP COLUMN "CreatedByUsername";
-- ALTER TABLE "Discussions" DROP COLUMN "CreatedByUsername";

-- Drop recently added indexes (if necessary)
-- DROP INDEX IF EXISTS "IX_Posts_CreatedByUserId";
-- DROP INDEX IF EXISTS "IX_Discussions_CreatedByUserId";
```

## Troubleshooting

### Connection Issues

```bash
# Test connection directly
psql -h localhost -p 5432 -U postgres -d cuefinder -c "SELECT 1"

# With password prompt
psql -h localhost -U postgres -d cuefinder
# Then enter password when prompted
```

### Permission Issues

```bash
# Make bash script executable
chmod +x deploy-database-schema.sh

# Make PowerShell script executable
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Docker Execution Issues

```bash
# Verify container is running
docker ps | grep postgres

# Check container logs
docker logs cuefinder-postgres

# Execute with bash explicitly
docker exec cuefinder-postgres bash -c "psql -U postgres -d cuefinder -f /tmp/schema-update.sql"
```

### Schema Validation Issues

```sql
-- Check column existence
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Posts' 
ORDER BY ordinal_position;

-- Check index definitions
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Posts';

-- Check table constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'Posts';
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Update Database Schema
  run: |
    docker cp ./scripts/database-schema-update.sql postgres:/tmp/
    docker exec postgres psql -U postgres -d cuefinder -f /tmp/database-schema-update.sql
  env:
    DB_HOST: ${{ secrets.DB_HOST }}
    DB_USER: ${{ secrets.DB_USER }}
```

### GitLab CI Example

```yaml
deploy-database:
  script:
    - psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f scripts/database-schema-update.sql
  environment:
    name: production
  only:
    - main
```

## Support & Maintenance

### Log Files

Log files are automatically created with timestamps:
- Format: `database-update-YYYYMMDD-HHMMSS.log`
- Location: Same directory as script
- Retention: Keep for audit trail (recommend 90 days)

### Monitoring

Monitor these metrics after deployment:

```sql
-- Check table row counts
SELECT schemaname, tablename, n_live_tup as row_count 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
ORDER BY n_live_tup DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan DESC;
```

## Version History

- **v1.0** (2026-01-16) - Initial release
  - Support for basic CueFinder schema
  - Forum system tables
  - User management
  - Product listings
  - Messaging system

## License

These scripts are part of the CueFinder project. Use only with authorization.

## Contact

For questions about database schema or deployment issues, contact the CueFinder development team.
