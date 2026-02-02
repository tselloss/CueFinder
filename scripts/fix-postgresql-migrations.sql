-- Database Migration Fix Script
-- This script fixes the PostgreSQL table naming issue
-- Run this AFTER Entity Framework has created the initial schema

-- PostgreSQL uses lowercase table names by default
-- EF Core creates: users, cues, cuecases, etc.
-- Old scripts used: "Users", "Cues", "CueCases"

\echo 'Fixing table references for PostgreSQL...'
\echo ''

-- Step 1: Verify current tables exist (lowercase)
\echo 'Current tables in database:'
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
\echo ''

-- Step 2: Add missing columns to users table (if they don't exist)
\echo 'Adding missing columns to users table...'

DO $$
BEGIN
    -- Add HidePhone column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'hidephone'
    ) THEN
        ALTER TABLE users ADD COLUMN "HidePhone" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added HidePhone column';
    END IF;

    -- Add AcceptedTerms column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'acceptedterms'
    ) THEN
        ALTER TABLE users ADD COLUMN "AcceptedTerms" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added AcceptedTerms column';
    END IF;

    -- Add AcceptedTermsAt column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'acceptedtermsat'
    ) THEN
        ALTER TABLE users ADD COLUMN "AcceptedTermsAt" TIMESTAMP NULL;
        RAISE NOTICE 'Added AcceptedTermsAt column';
    END IF;

    -- Add Location column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location'
    ) THEN
        ALTER TABLE users ADD COLUMN "Location" VARCHAR(200);
        RAISE NOTICE 'Added Location column';
    END IF;
END $$;

\echo 'User columns added successfully'
\echo ''

-- Step 3: Update existing users to have accepted terms (migration data)
\echo 'Updating existing users...'
UPDATE users 
SET "AcceptedTerms" = true,
    "AcceptedTermsAt" = "CreatedAt"
WHERE "AcceptedTerms" = false OR "AcceptedTerms" IS NULL;

\echo 'Updated existing users'
\echo ''

-- Step 4: Create indexes if they don't exist
\echo 'Creating indexes...'

CREATE INDEX IF NOT EXISTS "IX_users_Username" ON users ("Username");
CREATE INDEX IF NOT EXISTS "IX_users_Email" ON users ("Email");
CREATE INDEX IF NOT EXISTS "IX_users_IsActive" ON users ("IsActive");

CREATE INDEX IF NOT EXISTS "IX_cues_UserId" ON cues ("UserId");
CREATE INDEX IF NOT EXISTS "IX_cues_CueType" ON cues ("CueType") WHERE "CueType" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_cues_CreatedAt" ON cues ("CreatedAt");

CREATE INDEX IF NOT EXISTS "IX_cuecases_UserId" ON cuecases ("UserId");
CREATE INDEX IF NOT EXISTS "IX_cuecases_CaseType" ON cuecases ("CaseType") WHERE "CaseType" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_cuecases_CreatedAt" ON cuecases ("CreatedAt");

CREATE INDEX IF NOT EXISTS "IX_forumposts_CategoryId" ON forumposts ("CategoryId");
CREATE INDEX IF NOT EXISTS "IX_forumposts_UserId" ON forumposts ("UserId");
CREATE INDEX IF NOT EXISTS "IX_forumposts_CreatedAt" ON forumposts ("CreatedAt");

CREATE INDEX IF NOT EXISTS "IX_ratings_CueId" ON ratings ("CueId") WHERE "CueId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_ratings_UserId" ON ratings ("UserId");

CREATE INDEX IF NOT EXISTS "IX_images_CueId" ON images ("CueId") WHERE "CueId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_images_CueCaseId" ON images ("CueCaseId") WHERE "CueCaseId" IS NOT NULL;

\echo 'Indexes created successfully'
\echo ''

-- Step 5: Set first user as admin (if exists)
\echo 'Setting first user as admin...'
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE "Id" = 1;
    
    IF user_count > 0 THEN
        UPDATE users SET "Role" = 'admin' WHERE "Id" = 1;
        RAISE NOTICE 'User 1 set as admin';
    ELSE
        RAISE NOTICE 'No user with Id=1 found';
    END IF;
END $$;

\echo ''
\echo '=========================================='
\echo 'Migration Fix Complete!'
\echo '=========================================='
\echo ''
\echo 'Summary:'
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users') as column_count
FROM users
UNION ALL
SELECT 'cues', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cues') FROM cues
UNION ALL
SELECT 'cuecases', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'cuecases') FROM cuecases
UNION ALL
SELECT 'forumcategories', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'forumcategories') FROM forumcategories
UNION ALL
SELECT 'forumposts', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'forumposts') FROM forumposts
UNION ALL
SELECT 'ratings', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ratings') FROM ratings
UNION ALL
SELECT 'images', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'images') FROM images;

\echo ''
\echo 'Database is now ready!'
