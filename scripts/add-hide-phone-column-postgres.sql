-- Migration: Add HidePhone privacy setting to Users table
-- Date: 2026-01-13
-- Description: Adds column to allow users to hide their phone number from other users
-- Database: PostgreSQL

-- Add HidePhone column with default value of false (phone is visible by default)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'hide_phone'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "HidePhone" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added HidePhone column to Users table';
    ELSE
        RAISE NOTICE 'HidePhone column already exists in Users table';
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN "Users"."HidePhone" IS 'Indicates whether the user''s phone number should be hidden from other users';
