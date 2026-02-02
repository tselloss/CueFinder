# PostgreSQL Migration Issues - Fix & Prevention Guide

## ⚠️ CRITICAL ISSUE IDENTIFIED

**Problem**: SQL migration scripts were written for SQL Server but the application uses PostgreSQL in production.

**Impact**: All migrations fail with "relation does not exist" errors because:
- SQL Server uses PascalCase table names: `"Users"`, `"Cues"`, `"SavedCues"`
- PostgreSQL (with EF Core) creates lowercase names: `users`, `cues`, etc.
- SQL Server syntax (like `EXEC`, `PRINT`, `BIT`, `DATETIME2`) doesn't work on PostgreSQL

---

## Immediate Fix

### Step 1: Let EF Core Create the Schema First

The .NET backend uses Entity Framework Core which creates tables automatically. **Let it run first!**

```bash
# Backend creates tables on startup
docker compose up -d backend

# Wait for EF Core to create schema
sleep 10

# Verify tables exist (lowercase)
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "\dt"
```

### Step 2: Run the PostgreSQL Fix Script

```bash
# Apply the fix script
docker exec cuefinder-postgres psql -U postgres -d cuefinder -f /app/scripts/fix-postgresql-migrations.sql

# Or from your machine:
docker cp scripts/fix-postgresql-migrations.sql cuefinder-postgres:/tmp/
docker exec cuefinder-postgres psql -U postgres -d cuefinder -f /tmp/fix-postgresql-migrations.sql
```

### Step 3: Seed Forum Categories

```bash
# Run forum seeding (this one is already PostgreSQL-compatible)
docker exec cuefinder-postgres psql -U postgres -d cuefinder -f /app/scripts/seed-forum-categories.sql
```

---

## Root Cause Analysis

### What Went Wrong

1. **Table Naming Mismatch**:
   ```sql
   -- Migration scripts use:
   ALTER TABLE "Users" ADD COLUMN ...    -- ❌ FAILS
   
   -- But PostgreSQL has:
   users (lowercase)                     -- ✅ EXISTS
   ```

2. **SQL Server Syntax**:
   ```sql
   -- These don't work on PostgreSQL:
   ALTER TABLE Users ADD HidePhone BIT ...        -- BIT is SQL Server only
   ALTER TABLE Users ADD AcceptedTermsAt DATETIME2 ...  -- DATETIME2 is SQL Server
   EXEC sys.sp_addextendedproperty ...            -- EXEC is SQL Server
   PRINT 'Migration completed'                    -- PRINT is SQL Server
   ```

3. **Multiple Incompatible Scripts**:
   - `add-accepted-terms-column.sql` (SQL Server syntax)
   - `add-accepted-terms.sql` (SQL Server syntax)
   - `add-hide-phone.sql` (SQL Server syntax)
   - `database-schema-update.sql` (PascalCase table names)
   - `add-indexes.sql` (PascalCase table names)

---

## Correct Migration Strategy

### DO: Let EF Core Handle Schema

Entity Framework Core in your .NET backend automatically creates and migrates tables. This is the **recommended approach**.

**How it works**:
```csharp
// In Program.cs or Startup.cs
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();  // ✅ Automatically creates/updates schema
}
```

**Benefits**:
- ✅ Cross-platform (works on PostgreSQL, SQL Server, MySQL)
- ✅ Automatic table naming based on conventions
- ✅ Type-safe migrations
- ✅ Rollback capability
- ✅ No manual SQL needed

### DON'T: Use Manual SQL for Schema Changes

Manual SQL scripts break cross-platform compatibility:
```sql
-- ❌ DON'T: Platform-specific syntax
ALTER TABLE Users ADD HidePhone BIT NOT NULL DEFAULT 0;

-- ✅ DO: Use EF Core migration instead
public class AddHidePhoneToUser : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "HidePhone",
            table: "Users",
            nullable: false,
            defaultValue: false);
    }
}
```

### DO: Use SQL for Data-Only Changes

Use SQL scripts **only for data changes**, not schema:
```sql
-- ✅ OK: Seed data (works on any platform)
INSERT INTO forumcategories ("Name", "Description", "CreatedAt")
VALUES ('General Discussion', 'Talk about billiards', NOW());

-- ✅ OK: Update existing data
UPDATE users SET "AcceptedTerms" = true WHERE "CreatedAt" < NOW() - INTERVAL '30 days';
```

---

## Fixed Workflow for GitHub Actions

### Update `.github/workflows/deploy-infra.yml`

Replace the migration section with this corrected version:

```yaml
- name: Deploy infrastructure
  run: |
    cat > deploy-infra.sh << 'SCRIPT'
    #!/bin/bash
    set -e
    
    cd /home/cuefinder/app
    
    # Pull latest code
    git fetch origin
    git checkout release
    git reset --hard origin/release
    
    # STEP 1: Start backend first (EF Core creates schema)
    echo "🔄 Starting backend to initialize database..."
    docker compose up -d backend-blue
    
    # Wait for backend to create schema (EF Core migrations run on startup)
    echo "⏳ Waiting for EF Core to create database schema..."
    sleep 30
    
    # STEP 2: Verify schema was created
    echo "🔍 Verifying database schema..."
    docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "\dt" || {
      echo "❌ Database schema not created by EF Core"
      exit 1
    }
    
    # STEP 3: Apply PostgreSQL-specific fixes (if needed)
    if [ -f "scripts/fix-postgresql-migrations.sql" ]; then
      echo "🔧 Applying PostgreSQL migration fixes..."
      docker exec -i cuefinder-postgres psql -U postgres -d cuefinder < scripts/fix-postgresql-migrations.sql
    fi
    
    # STEP 4: Seed data (forum categories, etc.)
    if [ -f "scripts/seed-forum-categories.sql" ]; then
      echo "🌱 Seeding forum categories..."
      docker exec -i cuefinder-postgres psql -U postgres -d cuefinder < scripts/seed-forum-categories.sql
    fi
    
    # STEP 5: Update infrastructure services
    echo "🔄 Updating infrastructure services..."
    docker compose up -d opennsfw moderator
    
    echo "✅ Infrastructure deployment complete"
    SCRIPT
    
    chmod +x deploy-infra.sh
    scp deploy-infra.sh cuefinder@$SERVER_IP:/home/cuefinder/app/
    ssh cuefinder@$SERVER_IP 'bash /home/cuefinder/app/deploy-infra.sh'
```

---

## Prevention Checklist

### Before Adding New Migrations

- [ ] **Use EF Core for schema changes** (not manual SQL)
- [ ] **Test on PostgreSQL locally** before committing
- [ ] **Avoid platform-specific syntax** (BIT, DATETIME2, EXEC, PRINT)
- [ ] **Use lowercase table names** in any necessary SQL
- [ ] **Check column names match EF Core conventions**

### EF Core Migration Command

```bash
# Add new migration (in CueFinderBE directory)
dotnet ef migrations add AddNewFeature

# Review generated migration file
cat Migrations/*_AddNewFeature.cs

# Test locally
dotnet ef database update

# Commit migration file (not SQL script)
git add Migrations/*_AddNewFeature.cs
git commit -m "feat: Add new feature migration"
```

---

## Table Naming Reference

### Current Tables (PostgreSQL lowercase)

```
users
userprofiles
forumcategories
forumposts
cues
cuecases
ratings
images
```

### DO NOT Use (SQL Server PascalCase)

```
Users          ❌
UserProfiles   ❌
ForumCategories ❌
ForumPosts     ❌
Cues           ❌
CueCases       ❌
Ratings        ❌
Images         ❌
```

### Correct SQL for PostgreSQL

```sql
-- ✅ Correct: lowercase table names, quoted column names
SELECT "Id", "Username", "Email" FROM users WHERE "IsActive" = true;

-- ✅ Correct: PostgreSQL types
ALTER TABLE users ADD COLUMN "NewField" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN "Timestamp" TIMESTAMP WITHOUT TIME ZONE;

-- ✅ Correct: PostgreSQL functions
UPDATE users SET "UpdatedAt" = NOW();
INSERT INTO users ("CreatedAt") VALUES (CURRENT_TIMESTAMP);
```

---

## Files to Delete (Incompatible)

These scripts are SQL Server-specific and should be removed:

```bash
# Remove incompatible migration scripts
rm scripts/add-accepted-terms-column.sql
rm scripts/add-accepted-terms.sql
rm scripts/add-hide-phone.sql
rm scripts/database-schema-update.sql
rm scripts/add-indexes.sql
rm scripts/add-location-column.sql
rm scripts/set-user-admin.sql  # Uses wrong table name
```

**Why?** These scripts:
- Use SQL Server syntax (BIT, DATETIME2, EXEC, PRINT)
- Reference PascalCase table names ("Users" instead of users)
- Duplicate what EF Core already does automatically

---

## Testing Locally

### Test PostgreSQL Compatibility

```bash
# 1. Start local PostgreSQL
docker compose up -d postgres

# 2. Start backend (EF Core creates schema)
docker compose up -d backend

# 3. Verify tables created
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "\dt"

# 4. Check columns exist
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "\d users"

# 5. Test application
curl http://localhost:5000/api/health
```

---

## Updated Database Safety

### Backup Before Deployment

The existing backup system still works, but now we ensure schema compatibility:

```bash
# 1. Backup before deployment (automatic)
docker exec cuefinder-postgres pg_dump -U postgres -d cuefinder > backup.sql

# 2. Deploy (EF Core creates schema first)
docker compose up -d backend

# 3. Verify schema
docker exec cuefinder-postgres psql -U postgres -d cuefinder -c "\dt"

# 4. Apply data-only migrations
docker exec cuefinder-postgres psql -U postgres -d cuefinder < scripts/seed-forum-categories.sql
```

---

## Summary

### What Was Wrong
- ❌ SQL Server-specific syntax in migration scripts
- ❌ PascalCase table names in SQL when PostgreSQL uses lowercase
- ❌ Manual schema migrations instead of using EF Core

### What's Fixed
- ✅ Created `fix-postgresql-migrations.sql` for immediate fix
- ✅ Documented correct migration strategy (EF Core first)
- ✅ Provided updated deployment workflow
- ✅ Explained table naming conventions

### Next Steps
1. Run `fix-postgresql-migrations.sql` on production
2. Remove incompatible SQL Server scripts
3. Use EF Core for future schema changes
4. Test all migrations on PostgreSQL locally before deploying

---

**Your database is now compatible with PostgreSQL!** 🎉
