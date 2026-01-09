-- Migration: Add terms acceptance tracking to Users table (PostgreSQL)
-- Date: 2026-01-09
-- Description: Adds columns to track if user has accepted terms and conditions

-- Add AcceptedTerms column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'AcceptedTerms'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "AcceptedTerms" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added AcceptedTerms column to Users table';
    ELSE
        RAISE NOTICE 'AcceptedTerms column already exists';
    END IF;
END $$;

-- Add AcceptedTermsAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'AcceptedTermsAt'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "AcceptedTermsAt" TIMESTAMP NULL;
        RAISE NOTICE 'Added AcceptedTermsAt column to Users table';
    ELSE
        RAISE NOTICE 'AcceptedTermsAt column already exists';
    END IF;
END $$;

-- Update existing users to have accepted terms (for backwards compatibility)
UPDATE "Users"
SET "AcceptedTerms" = true,
    "AcceptedTermsAt" = "CreatedAt"
WHERE "AcceptedTerms" = false;

-- Add column comments
COMMENT ON COLUMN "Users"."AcceptedTerms" IS 'Indicates whether the user has accepted the terms and conditions';
COMMENT ON COLUMN "Users"."AcceptedTermsAt" IS 'Timestamp when the user accepted the terms and conditions';

-- Show success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Added AcceptedTerms column';
    RAISE NOTICE '   - Added AcceptedTermsAt column';
    RAISE NOTICE '   - Updated existing users';
END $$;
