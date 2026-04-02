-- Password Hash Migration Monitoring Script
-- This script helps track the progress of lazy password migration from SHA-256 to BCrypt
-- Run this periodically to monitor migration progress

-- =====================================================================
-- 1. MIGRATION PROGRESS OVERVIEW
-- =====================================================================
SELECT 
    'Migration Progress Overview' AS "Report Section",
    '' AS "------------------------------------";

SELECT 
    CASE "PasswordHashVersion"
        WHEN 1 THEN 'SHA-256 (Legacy)'
        WHEN 2 THEN 'BCrypt (Secure)'
        ELSE 'Unknown'
    END AS "Hash Algorithm",
    COUNT(*) AS "User Count",
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Percentage",
    CASE 
        WHEN "PasswordHashVersion" = 1 THEN '⚠️ Will upgrade on next login'
        WHEN "PasswordHashVersion" = 2 THEN '✅ Secure'
        ELSE '⚠️ Unknown version'
    END AS "Status"
FROM "Users"
GROUP BY "PasswordHashVersion"
ORDER BY "PasswordHashVersion";

-- =====================================================================
-- 2. RECENT MIGRATIONS
-- =====================================================================
SELECT 
    'Recently Migrated Users (Last 7 days)' AS "Report Section",
    '' AS "------------------------------------";

SELECT 
    "Id" AS "User ID",
    "Username",
    "LastLoginAt" AS "Last Login",
    "UpdatedAt" AS "Updated At",
    "PasswordHashVersion" AS "Hash Version"
FROM "Users"
WHERE "PasswordHashVersion" = 2
  AND "UpdatedAt" >= NOW() - INTERVAL '7 days'
  AND "LastLoginAt" >= NOW() - INTERVAL '7 days'
ORDER BY "UpdatedAt" DESC
LIMIT 50;

-- =====================================================================
-- 3. INACTIVE USERS STILL ON SHA-256
-- =====================================================================
SELECT 
    'Inactive Users Needing Migration (No login in 90+ days)' AS "Report Section",
    '' AS "------------------------------------";

SELECT 
    COUNT(*) AS "Count",
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "Users" WHERE "PasswordHashVersion" = 1), 2) AS "% of SHA-256 Users"
FROM "Users"
WHERE "PasswordHashVersion" = 1
  AND ("LastLoginAt" IS NULL OR "LastLoginAt" < NOW() - INTERVAL '90 days');

-- =====================================================================
-- 4. ACTIVE USERS STILL ON SHA-256
-- =====================================================================
SELECT 
    'Active Users Still on SHA-256 (Logged in last 30 days)' AS "Report Section",
    '' AS "------------------------------------";

SELECT 
    "Id" AS "User ID",
    "Username",
    "LastLoginAt" AS "Last Login",
    EXTRACT(DAY FROM (NOW() - "LastLoginAt")) AS "Days Since Login"
FROM "Users"
WHERE "PasswordHashVersion" = 1
  AND "LastLoginAt" >= NOW() - INTERVAL '30 days'
ORDER BY "LastLoginAt" DESC
LIMIT 25;

-- =====================================================================
-- 5. MIGRATION COMPLETION ESTIMATE
-- =====================================================================
SELECT 
    'Migration Completion Estimate' AS "Report Section",
    '' AS "------------------------------------";

WITH stats AS (
    SELECT 
        COUNT(*) FILTER (WHERE "PasswordHashVersion" = 1) AS sha256_count,
        COUNT(*) FILTER (WHERE "PasswordHashVersion" = 2) AS bcrypt_count,
        COUNT(*) FILTER (WHERE "PasswordHashVersion" = 1 AND "LastLoginAt" >= NOW() - INTERVAL '30 days') AS active_sha256,
        COUNT(*) FILTER (WHERE "PasswordHashVersion" = 1 AND ("LastLoginAt" IS NULL OR "LastLoginAt" < NOW() - INTERVAL '90 days')) AS inactive_sha256
    FROM "Users"
)
SELECT 
    sha256_count AS "Total SHA-256 Users",
    bcrypt_count AS "Total BCrypt Users",
    active_sha256 AS "Active SHA-256 (likely to migrate soon)",
    inactive_sha256 AS "Inactive SHA-256 (may never migrate)",
    ROUND(bcrypt_count * 100.0 / NULLIF(sha256_count + bcrypt_count, 0), 2) AS "Migration % Complete",
    CASE 
        WHEN sha256_count = 0 THEN '✅ Migration complete!'
        WHEN active_sha256 = 0 THEN '⚠️ Only inactive users remain on SHA-256'
        ELSE '🔄 Migration in progress'
    END AS "Status"
FROM stats;

-- =====================================================================
-- 6. RECOMMENDATIONS
-- =====================================================================
SELECT 
    'Migration Recommendations' AS "Report Section",
    '' AS "------------------------------------";

WITH stats AS (
    SELECT 
        COUNT(*) FILTER (WHERE "PasswordHashVersion" = 1) AS sha256_count,
        COUNT(*) FILTER (WHERE "PasswordHashVersion" = 1 AND ("LastLoginAt" IS NULL OR "LastLoginAt" < NOW() - INTERVAL '180 days')) AS very_inactive
    FROM "Users"
)
SELECT 
    CASE 
        WHEN sha256_count = 0 THEN 
            '✅ All users migrated! Consider removing SHA-256 verification code.'
        WHEN very_inactive > 0 THEN 
            '⚠️ ' || very_inactive || ' users inactive 180+ days. Consider password reset requirement for SHA-256 users at next login.'
        WHEN sha256_count < 100 THEN 
            '📊 < 100 users on SHA-256. Monitor for another 30 days.'
        ELSE 
            '🔄 Migration ongoing. ' || sha256_count || ' users still on SHA-256.'
    END AS "Recommendation"
FROM stats;
