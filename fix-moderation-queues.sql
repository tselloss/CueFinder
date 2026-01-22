-- Add missing columns to ModerationQueues
ALTER TABLE "ModerationQueues" ADD COLUMN IF NOT EXISTS "IsBeingReviewed" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "ModerationQueues" ADD COLUMN IF NOT EXISTS "ReviewingAdminId" integer;
ALTER TABLE "ModerationQueues" ADD COLUMN IF NOT EXISTS "ReviewStartedAt" timestamp with time zone;
ALTER TABLE "ModerationQueues" ADD COLUMN IF NOT EXISTS "AddedToQueueAt" timestamp with time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC');

-- Add missing foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ModerationQueues_Users_ReviewingAdminId') THEN
        ALTER TABLE "ModerationQueues" ADD CONSTRAINT "FK_ModerationQueues_Users_ReviewingAdminId" 
        FOREIGN KEY ("ReviewingAdminId") REFERENCES "Users"("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ModerationQueues' 
ORDER BY column_name;
