-- Fix NULL ModerationStatus values
UPDATE "Cues" SET "ModerationStatus" = '' WHERE "ModerationStatus" IS NULL;
UPDATE "CueCases" SET "ModerationStatus" = '' WHERE "ModerationStatus" IS NULL;
UPDATE "Messages" SET "ModerationStatus" = '' WHERE "ModerationStatus" IS NULL;

-- Verify
SELECT COUNT(*) as cues_with_null FROM "Cues" WHERE "ModerationStatus" IS NULL;
SELECT COUNT(*) as cuecases_with_null FROM "CueCases" WHERE "ModerationStatus" IS NULL;
SELECT COUNT(*) as messages_with_null FROM "Messages" WHERE "ModerationStatus" IS NULL;
