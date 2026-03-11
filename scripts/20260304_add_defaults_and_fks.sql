-- Safe, idempotent schema improvements (non-destructive)
-- Adds UUID defaults, CreatedAt defaults, and NOT VALID user FKs
-- Run in staging first. After resolving any orphaned rows, run
-- `ALTER TABLE ... VALIDATE CONSTRAINT ...` for each added FK.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Add DB-side UUID defaults for PK Id columns
ALTER TABLE "Categories" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Notifications" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Discussions" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
ALTER TABLE "DiscussionSubscriptions" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
ALTER TABLE "DiscussionViews" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Posts" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
ALTER TABLE "PostLikes" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();
ALTER TABLE "PostMentions" ALTER COLUMN "Id" SET DEFAULT gen_random_uuid();

-- 2) Add CreatedAt / timestamp defaults
ALTER TABLE "Categories" ALTER COLUMN "CreatedAt" SET DEFAULT now();
ALTER TABLE "Notifications" ALTER COLUMN "CreatedAt" SET DEFAULT now();
ALTER TABLE "Discussions" ALTER COLUMN "CreatedAt" SET DEFAULT now();
ALTER TABLE "Discussions" ALTER COLUMN "ModifiedAt" SET DEFAULT now();
ALTER TABLE "DiscussionSubscriptions" ALTER COLUMN "SubscribedAt" SET DEFAULT now();
ALTER TABLE "DiscussionViews" ALTER COLUMN "ViewedAt" SET DEFAULT now();
ALTER TABLE "Posts" ALTER COLUMN "CreatedAt" SET DEFAULT now();
ALTER TABLE "Posts" ALTER COLUMN "ModifiedAt" SET DEFAULT now();
ALTER TABLE "PostLikes" ALTER COLUMN "CreatedAt" SET DEFAULT now();
ALTER TABLE "PostMentions" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- 3) Add foreign keys to Users table in NOT VALID mode (safe, non-blocking)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Notifications_Users_UserId') THEN
    EXECUTE 'ALTER TABLE "Notifications" ADD CONSTRAINT "FK_Notifications_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Notifications_Users_TriggeredByUserId') THEN
    EXECUTE 'ALTER TABLE "Notifications" ADD CONSTRAINT "FK_Notifications_Users_TriggeredByUserId" FOREIGN KEY ("TriggeredByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Discussions_Users_CreatedByUserId') THEN
    EXECUTE 'ALTER TABLE "Discussions" ADD CONSTRAINT "FK_Discussions_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_DiscussionSubscriptions_Users_UserId') THEN
    EXECUTE 'ALTER TABLE "DiscussionSubscriptions" ADD CONSTRAINT "FK_DiscussionSubscriptions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_DiscussionViews_Users_UserId') THEN
    EXECUTE 'ALTER TABLE "DiscussionViews" ADD CONSTRAINT "FK_DiscussionViews_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Posts_Users_CreatedByUserId') THEN
    EXECUTE 'ALTER TABLE "Posts" ADD CONSTRAINT "FK_Posts_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_PostLikes_Users_UserId') THEN
    EXECUTE 'ALTER TABLE "PostLikes" ADD CONSTRAINT "FK_PostLikes_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_PostMentions_Users_MentionedUserId') THEN
    EXECUTE 'ALTER TABLE "PostMentions" ADD CONSTRAINT "FK_PostMentions_Users_MentionedUserId" FOREIGN KEY ("MentionedUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT NOT VALID';
  END IF;
END$$;

-- Notes:
-- - These FK constraints are added with NOT VALID so they do not scan/validate existing rows.
--   After cleaning orphaned rows in staging/CI, run:
--     ALTER TABLE "<table>" VALIDATE CONSTRAINT "<constraint_name>";
-- - Consider converting important timestamps to timestamptz in a controlled migration.
