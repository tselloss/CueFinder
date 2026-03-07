-- Create in-DB backup tables for orphaned forum rows (safe, idempotent)
-- Run this after taking a full logical backup (pg_dump) but before any UPDATE/DELETE.
-- Date tag: 20260304

CREATE SCHEMA IF NOT EXISTS backups;

-- Notifications orphaned by missing Users
CREATE TABLE IF NOT EXISTS backups.notifications_orphans_20260304 AS
SELECT now() AS backed_at, n.*
FROM "Notifications" n
LEFT JOIN "Users" u ON n."UserId" = u."Id"
WHERE u."Id" IS NULL;

-- Notifications triggered-by orphaned rows (nullable)
CREATE TABLE IF NOT EXISTS backups.notifications_triggeredby_orphans_20260304 AS
SELECT now() AS backed_at, n.*
FROM "Notifications" n
LEFT JOIN "Users" u ON n."TriggeredByUserId" = u."Id"
WHERE n."TriggeredByUserId" IS NOT NULL AND u."Id" IS NULL;

-- Discussions with missing CreatedByUserId
CREATE TABLE IF NOT EXISTS backups.discussions_orphans_20260304 AS
SELECT now() AS backed_at, d.*
FROM "Discussions" d
LEFT JOIN "Users" u ON d."CreatedByUserId" = u."Id"
WHERE u."Id" IS NULL;

-- Posts with missing CreatedByUserId
CREATE TABLE IF NOT EXISTS backups.posts_orphans_20260304 AS
SELECT now() AS backed_at, p.*
FROM "Posts" p
LEFT JOIN "Users" u ON p."CreatedByUserId" = u."Id"
WHERE u."Id" IS NULL;

-- PostLikes with missing UserId
CREATE TABLE IF NOT EXISTS backups.postlikes_orphans_20260304 AS
SELECT now() AS backed_at, pl.*
FROM "PostLikes" pl
LEFT JOIN "Users" u ON pl."UserId" = u."Id"
WHERE u."Id" IS NULL;

-- PostMentions with missing MentionedUserId
CREATE TABLE IF NOT EXISTS backups.postmentions_orphans_20260304 AS
SELECT now() AS backed_at, pm.*
FROM "PostMentions" pm
LEFT JOIN "Users" u ON pm."MentionedUserId" = u."Id"
WHERE u."Id" IS NULL;

-- Helpful: quick counts for confirmation
SELECT 'notifications_orphans' AS set, COUNT(*) FROM backups.notifications_orphans_20260304;
SELECT 'notifications_triggeredby_orphans' AS set, COUNT(*) FROM backups.notifications_triggeredby_orphans_20260304;
SELECT 'discussions_orphans' AS set, COUNT(*) FROM backups.discussions_orphans_20260304;
SELECT 'posts_orphans' AS set, COUNT(*) FROM backups.posts_orphans_20260304;
SELECT 'postlikes_orphans' AS set, COUNT(*) FROM backups.postlikes_orphans_20260304;
SELECT 'postmentions_orphans' AS set, COUNT(*) FROM backups.postmentions_orphans_20260304;

-- Reminder: take a full logical dump as well before proceeding.
-- Example (run from a machine with pg client access):
-- pg_dump -Fc -h <host> -p <port> -U <user> -d cuefinder -f cuefinder_backup_2026-03-04.dump
