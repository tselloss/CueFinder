-- ============================================================================
-- CueFinder Database Schema Update Script
-- ============================================================================
-- Purpose: Ensures database schema is up-to-date with all required columns,
--          indexes, and constraints. Safe to run multiple times (idempotent).
-- Usage: psql -U postgres -d cuefinder -f database-schema-update.sql
-- 
-- ⚠️  SAFETY GUARANTEES:
--     ✓ NO DROP statements - Never deletes columns, tables, or data
--     ✓ NO DELETE statements - Never removes existing data
--     ✓ NO TRUNCATE statements - Never clears tables
--     ✓ Idempotent - Safe to run multiple times
--     ✓ Add-only operations - Only creates new columns/indexes if missing
--     ✓ Update-safe - Updates defaults and constraints without data loss
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE UPDATES
-- ============================================================================
-- All columns already exist in Users table

-- ============================================================================
-- 2. CUES TABLE UPDATES
-- ============================================================================
-- All columns already exist in Cues table

-- ============================================================================
-- 3. CUE CASES TABLE UPDATES
-- ============================================================================
-- All columns already exist in CueCases table

-- ============================================================================
-- 4. CUE IMAGES TABLE UPDATES
-- ============================================================================
-- All columns already exist in CueImages table

-- ============================================================================
-- 5. CUE CASE IMAGES TABLE UPDATES
-- ============================================================================
-- All columns already exist in CueCaseImages table

-- ============================================================================
-- 6. RATINGS TABLE UPDATES
-- ============================================================================
-- All columns already exist in Ratings table

-- ============================================================================
-- 7. SAVED CUES TABLE UPDATES
-- ============================================================================
-- All columns already exist in SavedCues table

-- ============================================================================
-- 8. TRANSACTIONS TABLE UPDATES
-- ============================================================================
-- All columns already exist in Transactions table

-- ============================================================================
-- 9. MESSAGES TABLE UPDATES
-- ============================================================================
-- All columns already exist in Messages table

-- ============================================================================
-- 10. PHONE VERIFICATION TOKENS TABLE UPDATES
-- ============================================================================
-- All columns already exist in PhoneVerificationTokens table

-- ============================================================================
-- 11. FORUM CATEGORIES TABLE UPDATES
-- ============================================================================
-- All columns already exist in Categories table

-- ============================================================================
-- 12. DISCUSSIONS TABLE UPDATES
-- ============================================================================
-- Ensure CreatedByUsername column exists (added Jan 2026)
ALTER TABLE "Discussions" 
ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';

-- Ensure CreatedAt, ModifiedAt, LastReplyAt have proper defaults
ALTER TABLE "Discussions" 
ALTER COLUMN "CreatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "ModifiedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 13. POSTS TABLE UPDATES
-- ============================================================================
-- Ensure CreatedByUsername column exists (added Jan 2026)
ALTER TABLE "Posts"
ADD COLUMN IF NOT EXISTS "CreatedByUsername" text NOT NULL DEFAULT 'User';

-- Ensure reply threading column exists
ALTER TABLE "Posts"
ADD COLUMN IF NOT EXISTS "ReplyToPostId" uuid NULL;

-- Ensure timestamps have proper defaults
ALTER TABLE "Posts"
ALTER COLUMN "CreatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "ModifiedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 14. POST LIKES TABLE UPDATES
-- ============================================================================
-- All columns already exist in PostLikes table
ALTER TABLE "PostLikes"
ALTER COLUMN "CreatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 15. POST MENTIONS TABLE UPDATES
-- ============================================================================
-- All columns already exist in PostMentions table
ALTER TABLE "PostMentions"
ALTER COLUMN "CreatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 16. FORUM NOTIFICATIONS TABLE UPDATES
-- ============================================================================
-- All columns already exist in Notifications table
ALTER TABLE "Notifications"
ALTER COLUMN "CreatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 17. DISCUSSION SUBSCRIPTIONS TABLE UPDATES
-- ============================================================================
-- All columns already exist in DiscussionSubscriptions table
ALTER TABLE "DiscussionSubscriptions"
ALTER COLUMN "SubscribedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 18. DISCUSSION VIEWS TABLE UPDATES
-- ============================================================================
-- All columns already exist in DiscussionViews table
ALTER TABLE "DiscussionViews"
ALTER COLUMN "ViewedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 19. CREATE INDEXES IF NOT EXIST
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");
CREATE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX IF NOT EXISTS "IX_Users_IsActive" ON "Users" ("IsActive");

-- Cues table indexes
CREATE INDEX IF NOT EXISTS "IX_Cues_UserId" ON "Cues" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Cues_CueType" ON "Cues" ("CueType");
CREATE INDEX IF NOT EXISTS "IX_Cues_CreatedAt" ON "Cues" ("CreatedAt");

-- CueCases table indexes
CREATE INDEX IF NOT EXISTS "IX_CueCases_UserId" ON "CueCases" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_CueCases_CaseType" ON "CueCases" ("CaseType");
CREATE INDEX IF NOT EXISTS "IX_CueCases_CreatedAt" ON "CueCases" ("CreatedAt");

-- Forum table indexes
CREATE INDEX IF NOT EXISTS "IX_Categories_IsActive" ON "Categories" ("IsActive");
CREATE INDEX IF NOT EXISTS "IX_Discussions_CategoryId" ON "Discussions" ("CategoryId");
CREATE INDEX IF NOT EXISTS "IX_Discussions_CreatedByUserId" ON "Discussions" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_Discussions_CreatedAt" ON "Discussions" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_DiscussionId" ON "Posts" ("DiscussionId");
CREATE INDEX IF NOT EXISTS "IX_Posts_CreatedByUserId" ON "Posts" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_Posts_CreatedAt" ON "Posts" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_ReplyToPostId" ON "Posts" ("ReplyToPostId");
CREATE INDEX IF NOT EXISTS "IX_PostLikes_PostId" ON "PostLikes" ("PostId");
CREATE INDEX IF NOT EXISTS "IX_PostMentions_PostId" ON "PostMentions" ("PostId");
CREATE INDEX IF NOT EXISTS "IX_PostMentions_MentionedUserId" ON "PostMentions" ("MentionedUserId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead" ON "Notifications" ("UserId", "IsRead");

-- Messages table indexes
CREATE INDEX IF NOT EXISTS "IX_Messages_SenderId" ON "Messages" ("SenderId");
CREATE INDEX IF NOT EXISTS "IX_Messages_RecipientId" ON "Messages" ("RecipientId");
CREATE INDEX IF NOT EXISTS "IX_Messages_IsRead" ON "Messages" ("IsRead");
CREATE INDEX IF NOT EXISTS "IX_Messages_CreatedAt" ON "Messages" ("CreatedAt");

-- Ratings table indexes
CREATE INDEX IF NOT EXISTS "IX_Ratings_CueId" ON "Ratings" ("CueId");
CREATE INDEX IF NOT EXISTS "IX_Ratings_RatedByUserId" ON "Ratings" ("RatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_Ratings_SellerUserId" ON "Ratings" ("SellerUserId");

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS "IX_Transactions_CueId" ON "Transactions" ("CueId");
CREATE INDEX IF NOT EXISTS "IX_Transactions_SellerId" ON "Transactions" ("SellerId");
CREATE INDEX IF NOT EXISTS "IX_Transactions_BuyerId" ON "Transactions" ("BuyerId");
CREATE INDEX IF NOT EXISTS "IX_Transactions_Status" ON "Transactions" ("Status");

-- SavedCues table indexes
CREATE INDEX IF NOT EXISTS "IX_SavedCues_UserId" ON "SavedCues" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_SavedCues_CueId" ON "SavedCues" ("CueId");

-- ============================================================================
-- 20. UPDATE EXISTING DATA IF NEEDED
-- ============================================================================

-- Backfill CreatedByUsername for posts/discussions that don't have it
UPDATE "Discussions" 
SET "CreatedByUsername" = 'User' 
WHERE "CreatedByUsername" IS NULL OR "CreatedByUsername" = '';

UPDATE "Posts"
SET "CreatedByUsername" = 'User'
WHERE "CreatedByUsername" IS NULL OR "CreatedByUsername" = '';

-- ============================================================================
-- 21. VERIFY SCHEMA
-- ============================================================================
-- This section provides helpful queries to verify the schema is correct

-- Display final schema status
SELECT 'Schema Update Complete' as Status;

-- Count total tables
SELECT COUNT(*) as TotalTables FROM information_schema.tables WHERE table_schema = 'public';

-- Count total columns
SELECT COUNT(*) as TotalColumns FROM information_schema.columns WHERE table_schema = 'public';

-- Count total indexes
SELECT COUNT(*) as TotalIndexes FROM pg_indexes WHERE schemaname = 'public';

-- ============================================================================
-- END OF SCHEMA UPDATE SCRIPT
-- ============================================================================
