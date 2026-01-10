-- Add AcceptedTerms and AcceptedTermsAt columns to Users table
-- This migration adds fields to track user acceptance of terms and conditions

-- For PostgreSQL
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "AcceptedTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "AcceptedTermsAt" TIMESTAMP NULL;

-- Optional: Update existing users to mark them as having accepted terms
-- (This is a business decision - you may want to require existing users to re-accept)
-- UPDATE "Users" SET "AcceptedTerms" = true, "AcceptedTermsAt" = "CreatedAt" WHERE "AcceptedTerms" = false;

COMMENT ON COLUMN "Users"."AcceptedTerms" IS 'Whether the user has accepted the terms and conditions';
COMMENT ON COLUMN "Users"."AcceptedTermsAt" IS 'Timestamp when the user accepted the terms and conditions';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'Users' 
AND column_name IN ('AcceptedTerms', 'AcceptedTermsAt')
ORDER BY column_name;
