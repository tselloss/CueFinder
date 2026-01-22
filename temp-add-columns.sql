ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';
ALTER TABLE "Discussions" ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';
