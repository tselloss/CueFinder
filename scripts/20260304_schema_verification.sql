-- Verification queries to run in staging/CI before enabling stricter constraints

-- 1) Find duplicate usernames/emails
SELECT "Username", COUNT(*) as cnt FROM "Users" GROUP BY "Username" HAVING COUNT(*) > 1;
SELECT "Email", COUNT(*) as cnt FROM "Users" GROUP BY "Email" HAVING COUNT(*) > 1;

-- 2) Find duplicate category names
SELECT "Name", COUNT(*) as cnt FROM "Categories" GROUP BY "Name" HAVING COUNT(*) > 1;

-- 3) Orphaned forum references (users missing)
SELECT COUNT(*) as orphan_notifications_userid FROM "Notifications" n LEFT JOIN "Users" u ON n."UserId" = u."Id" WHERE u."Id" IS NULL;
SELECT COUNT(*) as orphan_notifications_triggeredby FROM "Notifications" n LEFT JOIN "Users" u ON n."TriggeredByUserId" = u."Id" WHERE n."TriggeredByUserId" IS NOT NULL AND u."Id" IS NULL;
SELECT COUNT(*) as orphan_discussions_createdby FROM "Discussions" d LEFT JOIN "Users" u ON d."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL;
SELECT COUNT(*) as orphan_posts_createdby FROM "Posts" p LEFT JOIN "Users" u ON p."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL;
SELECT COUNT(*) as orphan_postlikes_userid FROM "PostLikes" pl LEFT JOIN "Users" u ON pl."UserId" = u."Id" WHERE u."Id" IS NULL;
SELECT COUNT(*) as orphan_postmentions_mentioneduser FROM "PostMentions" pm LEFT JOIN "Users" u ON pm."MentionedUserId" = u."Id" WHERE u."Id" IS NULL;

-- 4) Rows with NULL CreatedAt / ModifiedAt where NOT NULL expected
SELECT COUNT(*) FROM "Posts" WHERE "CreatedAt" IS NULL;
SELECT COUNT(*) FROM "Discussions" WHERE "CreatedAt" IS NULL;

-- 5) Check whether Id columns have defaults
SELECT table_name, column_name, column_default FROM information_schema.columns
 WHERE table_schema='public' AND column_name='Id' AND table_name IN ('Categories','Notifications','Discussions','DiscussionSubscriptions','DiscussionViews','Posts','PostLikes','PostMentions');

-- 6) Columns using timestamp without time zone (to decide timestamptz migration)
SELECT table_name, column_name, data_type FROM information_schema.columns
 WHERE table_schema='public' AND data_type='timestamp without time zone' ORDER BY table_name;

-- 7) Quick counts for verification
SELECT COUNT(*) FROM "Categories";
SELECT COUNT(*) FROM "Discussions";
SELECT COUNT(*) FROM "Posts";
