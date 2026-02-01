-- Production Schema Initialization & Verification Script
-- This script only ADDS missing elements - never DELETES anything
-- Safe to run multiple times - uses IF NOT EXISTS checks
-- Generated: January 30, 2026

-- ============================================================
-- 1. CREATE MISSING COLUMNS (only if not exists)
-- ============================================================

-- Users table - add PasswordResetToken if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='Users' AND column_name='PasswordResetToken'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN "PasswordResetToken" VARCHAR(255) NULL;
    RAISE NOTICE 'Added Users.PasswordResetToken column';
  ELSE
    RAISE NOTICE 'Users.PasswordResetToken column already exists';
  END IF;
END $$;

-- Users table - add PasswordResetTokenExpiry if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='Users' AND column_name='PasswordResetTokenExpiry'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN "PasswordResetTokenExpiry" TIMESTAMP NULL;
    RAISE NOTICE 'Added Users.PasswordResetTokenExpiry column';
  ELSE
    RAISE NOTICE 'Users.PasswordResetTokenExpiry column already exists';
  END IF;
END $$;

-- ============================================================
-- 2. CREATE MISSING INDEXES (only if not exists)
-- ============================================================

-- Index on Users email for faster lookups
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='Users' AND indexname='IX_Users_Email'
  ) THEN
    CREATE INDEX "IX_Users_Email" ON "Users"("Email");
    RAISE NOTICE 'Created index IX_Users_Email';
  ELSE
    RAISE NOTICE 'Index IX_Users_Email already exists';
  END IF;
END $$;

-- Index on Users username for faster lookups
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='Users' AND indexname='IX_Users_Username'
  ) THEN
    CREATE INDEX "IX_Users_Username" ON "Users"("Username");
    RAISE NOTICE 'Created index IX_Users_Username';
  ELSE
    RAISE NOTICE 'Index IX_Users_Username already exists';
  END IF;
END $$;

-- Index on Cues CreatedAt for sorting
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='Cues' AND indexname='IX_Cues_CreatedAt'
  ) THEN
    CREATE INDEX "IX_Cues_CreatedAt" ON "Cues"("CreatedAt");
    RAISE NOTICE 'Created index IX_Cues_CreatedAt';
  ELSE
    RAISE NOTICE 'Index IX_Cues_CreatedAt already exists';
  END IF;
END $$;

-- Index on ModerationQueues Status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='ModerationQueues' AND indexname='IX_ModerationQueues_Status'
  ) THEN
    BEGIN
      CREATE INDEX "IX_ModerationQueues_Status" ON "ModerationQueues"("Status");
      RAISE NOTICE 'Created index IX_ModerationQueues_Status';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create IX_ModerationQueues_Status - column may not exist';
    END;
  ELSE
    RAISE NOTICE 'Index IX_ModerationQueues_Status already exists';
  END IF;
END $$;

-- Index on Discussions CreatedAt for sorting
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='Discussions' AND indexname='IX_Discussions_CreatedAt'
  ) THEN
    CREATE INDEX "IX_Discussions_CreatedAt" ON "Discussions"("CreatedAt");
    RAISE NOTICE 'Created index IX_Discussions_CreatedAt';
  ELSE
    RAISE NOTICE 'Index IX_Discussions_CreatedAt already exists';
  END IF;
END $$;

-- ============================================================
-- 3. VERIFY CRITICAL TABLES EXIST
-- ============================================================

DO $$
DECLARE
  required_tables TEXT[] := ARRAY[
    'Users', 'Categories', 'Cues', 'CueImages', 'CueCases', 'CueCaseImages',
    'BilliardTables', 'BilliardTableImages', 'Accessories', 'AccessoryImages',
    'Discussions', 'Posts', 'Messages', 'Ratings', 'Transactions',
    'ModerationQueues', 'FlaggedImages', 'Notifications', 'UserReports'
  ];
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  tbl TEXT;
  table_count INT := 0;
BEGIN
  FOREACH tbl IN ARRAY required_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema='public' AND information_schema.tables.table_name=tbl
    ) THEN
      table_count := table_count + 1;
    ELSE
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE 'WARNING: Missing % tables: %', array_length(missing_tables, 1), missing_tables;
  ELSE
    RAISE NOTICE 'Schema verification: All % critical tables exist', table_count;
  END IF;
END $$;

-- ============================================================
-- 4. VERIFY CRITICAL COLUMNS IN KEY TABLES
-- ============================================================

DO $$
DECLARE
  required_cols TEXT[] := ARRAY[
    'Id', 'Username', 'Email', 'PasswordHash', 'Role', 'CreatedAt', 'IsActive'
  ];
  missing_cols TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
  col_count INT := 0;
BEGIN
  FOREACH col_name IN ARRAY required_cols LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='Users' AND column_name=col_name
    ) THEN
      col_count := col_count + 1;
    ELSE
      missing_cols := array_append(missing_cols, col_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_cols, 1) > 0 THEN
    RAISE NOTICE 'WARNING: Missing % Users columns: %', array_length(missing_cols, 1), missing_cols;
  ELSE
    RAISE NOTICE 'Column verification: All % Users columns exist', col_count;
  END IF;
END $$;

SELECT 'Schema verification completed successfully' AS status;
