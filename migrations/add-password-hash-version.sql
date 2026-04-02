-- Migration: Add PasswordHashVersion column for lazy password hash migration
-- Date: 2026-04-02
-- Purpose: Support migration from SHA-256 to BCrypt password hashing

-- Add PasswordHashVersion column (default 1 for existing SHA-256 hashes)
ALTER TABLE "Users" 
ADD COLUMN "PasswordHashVersion" INTEGER NOT NULL DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN "Users"."PasswordHashVersion" IS 'Password hash algorithm version: 1=SHA256 (legacy), 2=BCrypt (current)';

-- Create index for monitoring migration progress
CREATE INDEX "IX_Users_PasswordHashVersion" ON "Users" ("PasswordHashVersion");

-- Display migration stats
SELECT 
    "PasswordHashVersion",
    COUNT(*) as "UserCount",
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as "Percentage"
FROM "Users"
GROUP BY "PasswordHashVersion"
ORDER BY "PasswordHashVersion";

COMMENT ON MIGRATION IS 'All existing users default to version 1 (SHA-256). They will be automatically upgraded to version 2 (BCrypt) on next successful login.';
