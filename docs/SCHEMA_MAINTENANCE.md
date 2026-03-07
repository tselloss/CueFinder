# Database Schema Maintenance Guide

This document describes the safe schema migration and maintenance workflow for CueFinder using idempotent SQL scripts and a GitHub Actions CI/CD pipeline.

## Overview

The schema maintenance process is designed to:
- **Preserve all data** – no destructive operations
- **Verify data integrity** before applying constraints
- **Provide audit trails** – backups and migration history
- **Enable safe staged rollout** – staging → production with manual approvals

## Scripts

All scripts are date-stamped (e.g., `20260304_*`) and idempotent (safe to run multiple times).

### 1. **Verification Script** (`20260304_schema_verification.sql`)
Detects data quality issues that must be resolved before applying stricter constraints.

**Checks:**
- Duplicate `Username` / `Email` in users
- Duplicate `Category.Name` in forum categories
- Orphaned forum records (users missing, timestamps NULL)
- Schema defaults and column types

**Run locally:**
```bash
psql -d cuefinder -f scripts/20260304_schema_verification.sql
```

**Expected output:** Lists counts of issues found. Zero counts = data is clean.

---

### 2. **Create In-DB Backups** (`20260304_create_orphan_backups.sql`)
Creates timestamped backup tables for any orphaned (inconsistent) rows *before* any cleanup attempt.

**Creates:**
- `backups.notifications_orphans_20260304`
- `backups.discussions_orphans_20260304`
- `backups.posts_orphans_20260304`
- `backups.postlikes_orphans_20260304`
- `backups.postmentions_orphans_20260304`

**Run after verification:**
```bash
psql -d cuefinder -f scripts/20260304_create_orphan_backups.sql
```

**Keep these tables** until you confirm everything is working.

---

### 3. **Add Defaults & FK Constraints** (`20260304_add_defaults_and_fks.sql`)
Adds:
- **UUID defaults** (`gen_random_uuid()`) for primary keys
- **Timestamp defaults** (`now()`) for created/modified columns
- **NOT VALID foreign keys** to `Users` table (safe – does not scan existing rows)

**Run after backups:**
```bash
psql -d cuefinder -f scripts/20260304_add_defaults_and_fks.sql
```

**Why NOT VALID?** Avoids full-table scans and blocking on existing data. You validate these constraints later after confirming no orphans remain.

---

### 4. **Cleanup & Attempt Validation** (`20260304_cleanup_and_validate.sql`)
- Attempts to fix nullable orphaned columns (sets to NULL where safe)
- Reports non-nullable orphaned rows for manual inspection
- Auto-validates constraints if zero orphans remain

**Run after defaults/FKs:**
```bash
psql -d cuefinder -f scripts/20260304_cleanup_and_validate.sql 2>&1 | tee cleanup.log
```

**Check output:** If you see "No remaining orphaned user references", proceed to step 5.

---

### 5. **Validate Constraints** (`20260304_validate_constraints.sql`)
Scans all existing rows to confirm they satisfy the NOT VALID foreign key constraints, then marks them as validated.

**Run only if cleanup reported zero orphans:**
```bash
psql -d cuefinder -f scripts/20260304_validate_constraints.sql
```

---

## CI/CD Workflow

The GitHub Actions workflow (`.github/workflows/schema-safe-update.yml`) automates the entire process with **two jobs**:

### **Job 1: `schema-update` (Staging)**
Runs on `staging` environment (requires manual approval to trigger).

**Steps:**
1. Dump full DB (`pg_dump`)
2. Run verification wrapper → fails if issues found
3. Create in-DB orphan backups
4. Apply safe defaults & NOT VALID FKs
5. Run cleanup & attempt validation
6. Upload DB dump and verification log as artifacts

**Artifacts uploaded:**
- `db-dump/cuefinder_backup_YYYY-MM-DD.dump` – full logical backup
- `verification-log/verification.out` – detailed check results

### **Job 2: `validate-constraints` (Production)**
Runs *only after* `schema-update` succeeds, requires approval from `production` environment.

**Steps:**
1. Download verification status from previous job
2. Check that status is `OK` (zero remaining orphans)
3. Run `20260304_validate_constraints.sql`

---

## Setup & Requirements

### GitHub Secrets
You must add these secrets to your repository (Settings → Secrets and variables → Actions):

| Secret | Example | Description |
|--------|---------|-------------|
| `PGHOST` | `postgres.example.com` | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port (usually 5432) |
| `PGUSER` | `cuefinder_admin` | Database user |
| `PGPASSWORD` | `(strong password)` | Database password |
| `PGDATABASE` | `cuefinder` | Database name |

### Environment Protection Rules
1. Go to Settings → Environments
2. Create or update `staging` environment
   - No protection rule needed (or set reviewers as preferred)
3. Create or update `production` environment
   - **Add required reviewers** (so the second job requires human approval)

---

## Manual Workflow (Without CI)

If you prefer to run locally:

```bash
# 1. Full dump (backup)
pg_dump -Fc -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  -f cuefinder_backup_$(date +%F).dump

# 2. Verify
psql -d cuefinder -f scripts/20260304_schema_verification.sql | tee verify.out

# If any issues found, stop here and fix them manually in the database

# 3. Backup orphans
psql -d cuefinder -f scripts/20260304_create_orphan_backups.sql

# 4. Apply defaults & FKs
psql -d cuefinder -f scripts/20260304_add_defaults_and_fks.sql

# 5. Cleanup & attempt validation
psql -d cuefinder -f scripts/20260304_cleanup_and_validate.sql | tee cleanup.out

# 6. If cleanup says "No remaining orphans", validate constraints
psql -d cuefinder -f scripts/20260304_validate_constraints.sql
```

---

## Troubleshooting

### ❌ Verification reports orphans

**Action:** Before running any migrations, you must resolve these in the database:

- **Duplicate usernames/emails:** Update or delete duplicate records
- **Orphaned forum rows:** Either delete them or reassign them to a valid user ID
- **NULL timestamps:** Update with `NOW()` or a valid timestamp

Then re-run the verification script.

### ❌ Cleanup reports non-nullable orphans

**Action:** The cleanup script will print sample rows. Example:

```
[WARN] Discussions.CreatedByUserId has 5 orphan rows. Sample rows:
  d1234-id
  d5678-id
  ...
```

Inspect and fix these manually:

```sql
-- Option 1: Delete them (if safe)
DELETE FROM "Discussions" WHERE "Id" = 'd1234-id';

-- Option 2: Assign to a default user
UPDATE "Discussions" SET "CreatedByUserId" = '<admin-user-id>' 
  WHERE "CreatedByUserId" NOT IN (SELECT "Id" FROM "Users");

-- Then re-run cleanup script
psql -d cuefinder -f scripts/20260304_cleanup_and_validate.sql
```

### ❌ Constraint validation fails

If validation fails, check the error message. Most likely:

1. New orphaned rows were inserted between cleanup and validation
2. Timestamps are in the wrong timezone
3. A previous constraint was partially applied

Inspect with:

```sql
-- Find the bad rows
SELECT n."Id" FROM "Notifications" n 
LEFT JOIN "Users" u ON n."UserId" = u."Id" 
WHERE u."Id" IS NULL LIMIT 20;
```

Fix, then retry validation.

---

## Rollback

If something goes wrong, you can restore from the logical dump:

```bash
# Restore from backup
pg_restore -Fc -d cuefinder cuefinder_backup_YYYY-MM-DD.dump
```

Or use the in-DB backup tables to understand what was changed:

```sql
-- Inspect the backed-up orphans
SELECT * FROM backups.notifications_orphans_20260304 LIMIT 10;
```

---

## Recommendations

1. **Always test in staging first.** Use the CI workflow against a staging database.
2. **Keep backups for 30+ days.** Store the logical dumps (`*.dump`) in version control or an artifact repository.
3. **Monitor constraint validation.** After first deployment, verify all FK constraints are enabled:
   ```sql
   SELECT constraint_name, is_deferrable FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
   ```
4. **Automated CI over manual scripts.** Once tested, always use the GitHub Actions workflow—it provides audit trails and artifact storage.

---

## Contact & Questions

For schema maintenance questions, refer to the constraint names and details in any of the SQL scripts (all are heavily commented).

