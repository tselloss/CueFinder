-- ============================================================
-- CueFinder Production Schema Update & Verification Script
-- ============================================================
-- This script:
--   • ADDS missing columns (never deletes)
--   • ADDS missing indexes for performance
--   • VERIFIES all critical tables exist
--   • VERIFIES all critical columns exist
--   • Safe to run multiple times - idempotent
-- ============================================================

-- ============================================================
-- 1. ADD MISSING COLUMNS (IF NOT EXISTS)
-- ============================================================

-- Users: IsVerified column (admin-verified seller badge)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='IsVerified') THEN
    ALTER TABLE "Users" ADD COLUMN "IsVerified" BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE 'Added Users.IsVerified column';
  ELSE
    RAISE NOTICE 'Users.IsVerified column already exists';
  END IF;
END $$;

-- Users: Password Reset Token columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='PasswordResetToken') THEN
    ALTER TABLE "Users" ADD COLUMN "PasswordResetToken" VARCHAR(255) NULL;
    RAISE NOTICE 'Added Users.PasswordResetToken column';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='PasswordResetTokenExpiry') THEN
    ALTER TABLE "Users" ADD COLUMN "PasswordResetTokenExpiry" TIMESTAMP NULL;
    RAISE NOTICE 'Added Users.PasswordResetTokenExpiry column';
  END IF;
END $$;

-- ============================================================
-- 2. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================

-- Users indexes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Users' AND indexname='IX_Users_Email') THEN
    CREATE INDEX "IX_Users_Email" ON "Users"("Email");
    RAISE NOTICE 'Created index IX_Users_Email';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Users' AND indexname='IX_Users_Username') THEN
    CREATE INDEX "IX_Users_Username" ON "Users"("Username");
    RAISE NOTICE 'Created index IX_Users_Username';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Users' AND indexname='IX_Users_IsActive') THEN
    CREATE INDEX "IX_Users_IsActive" ON "Users"("IsActive");
    RAISE NOTICE 'Created index IX_Users_IsActive';
  END IF;
END $$;

-- Cues indexes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Cues' AND indexname='IX_Cues_CreatedAt') THEN
    CREATE INDEX "IX_Cues_CreatedAt" ON "Cues"("CreatedAt" DESC);
    RAISE NOTICE 'Created index IX_Cues_CreatedAt';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Cues' AND indexname='IX_Cues_UserId') THEN
    CREATE INDEX "IX_Cues_UserId" ON "Cues"("UserId");
    RAISE NOTICE 'Created index IX_Cues_UserId';
  END IF;
END $$;

-- Discussions indexes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Discussions' AND indexname='IX_Discussions_CreatedAt') THEN
    CREATE INDEX "IX_Discussions_CreatedAt" ON "Discussions"("CreatedAt" DESC);
    RAISE NOTICE 'Created index IX_Discussions_CreatedAt';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create IX_Discussions_CreatedAt: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Discussions' AND indexname='IX_Discussions_CueId') THEN
    BEGIN
      CREATE INDEX "IX_Discussions_CueId" ON "Discussions"("CueId");
      RAISE NOTICE 'Created index IX_Discussions_CueId';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create IX_Discussions_CueId: Column may not exist';
    END;
  END IF;
END $$;

-- ModerationQueues indexes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='ModerationQueues' AND indexname='IX_ModerationQueues_Priority') THEN
    CREATE INDEX "IX_ModerationQueues_Priority" ON "ModerationQueues"("Priority");
    RAISE NOTICE 'Created index IX_ModerationQueues_Priority';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='ModerationQueues' AND indexname='IX_ModerationQueues_IsBeingReviewed') THEN
    CREATE INDEX "IX_ModerationQueues_IsBeingReviewed" ON "ModerationQueues"("IsBeingReviewed");
    RAISE NOTICE 'Created index IX_ModerationQueues_IsBeingReviewed';
  END IF;
END $$;

-- FlaggedImages indexes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='FlaggedImages' AND indexname='IX_FlaggedImages_CreatedAt') THEN
    BEGIN
      CREATE INDEX "IX_FlaggedImages_CreatedAt" ON "FlaggedImages"("CreatedAt" DESC);
      RAISE NOTICE 'Created index IX_FlaggedImages_CreatedAt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create IX_FlaggedImages_CreatedAt: Column may not exist';
    END;
  END IF;
END $$;

-- Posts indexes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Posts' AND indexname='IX_Posts_CreatedAt') THEN
    CREATE INDEX "IX_Posts_CreatedAt" ON "Posts"("CreatedAt" DESC);
    RAISE NOTICE 'Created index IX_Posts_CreatedAt';
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
    'ModerationQueues', 'FlaggedImages', 'Notifications', 'UserReports',
    'DiscussionSubscriptions', 'DiscussionViews', 'PostLikes', 'PostMentions',
    'SavedCues', 'SavedBilliardTables', 'PhoneVerificationTokens'
  ];
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  tbl TEXT;
  table_count INT := 0;
BEGIN
  FOREACH tbl IN ARRAY required_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      table_count := table_count + 1;
    ELSE
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE WARNING 'Missing % tables: %', array_length(missing_tables, 1), missing_tables;
  ELSE
    RAISE NOTICE 'Table verification: All % critical tables exist', table_count;
  END IF;
END $$;

-- ============================================================
-- 4. VERIFY CRITICAL COLUMNS IN KEY TABLES
-- ============================================================

DO $$
DECLARE
  required_cols TEXT[] := ARRAY[
    'Id', 'Username', 'Email', 'PasswordHash', 'Role', 'CreatedAt', 'IsActive', 'IsVerified'
  ];
  missing_cols TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
  col_count INT := 0;
BEGIN
  FOREACH col_name IN ARRAY required_cols LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name=col_name) THEN
      col_count := col_count + 1;
    ELSE
      missing_cols := array_append(missing_cols, col_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_cols, 1) > 0 THEN
    RAISE WARNING 'Missing Users columns: %', missing_cols;
  ELSE
    RAISE NOTICE 'Column verification: All % Users columns exist', col_count;
  END IF;
END $$;

-- ============================================================
-- 5. VERIFY DATABASE STATISTICS
-- ============================================================

SELECT 
  'Schema Verification Complete' as check_status,
  current_database() as database_name,
  current_user as db_user,
  now() as verification_timestamp;
