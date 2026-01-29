-- Database Schema Verification Script
-- This script checks the completeness and integrity of the CueFinder database

-- 1. TABLE EXISTENCE CHECK
SELECT 'TABLE CHECK' as check_type, tablename as item, 'EXISTS' as status 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. RECORD COUNTS IN KEY TABLES
SELECT 'DATA COUNT' as check_type, 'Users' as table_name, COUNT(*) as record_count FROM "Users"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'Cues' as table_name, COUNT(*) as record_count FROM "Cues"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'Messages' as table_name, COUNT(*) as record_count FROM "Messages"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'Discussions' as table_name, COUNT(*) as record_count FROM "Discussions"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'Posts' as table_name, COUNT(*) as record_count FROM "Posts"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'Categories' as table_name, COUNT(*) as record_count FROM "Categories"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'BilliardTables' as table_name, COUNT(*) as record_count FROM "BilliardTables"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'Accessories' as table_name, COUNT(*) as record_count FROM "Accessories"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'Ratings' as table_name, COUNT(*) as record_count FROM "Ratings"
UNION ALL
SELECT 'DATA COUNT' as check_type, 'ModerationQueues' as table_name, COUNT(*) as record_count FROM "ModerationQueues";

-- 3. USERS WITH DIFFERENT ROLES
SELECT 'USER ROLES' as check_type, "Role", COUNT(*) as count FROM "Users" GROUP BY "Role";

-- 4. FOREIGN KEY INTEGRITY
SELECT 'FK CHECK' as check_type, 
       constraint_name, 
       table_name, 
       column_name, 
       'DEFINED' as status
FROM information_schema.key_column_usage 
WHERE table_schema='public' 
  AND constraint_name LIKE 'FK_%'
ORDER BY table_name, constraint_name;

-- 5. MISSING CRITICAL COLUMNS CHECK
SELECT 'COLUMN CHECK' as check_type,
       table_name,
       column_name,
       data_type,
       CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULLABLE' END as nullable_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Users', 'Cues', 'Messages', 'Discussions', 'Posts', 'Categories')
ORDER BY table_name, ordinal_position;

-- 6. INDEXES DEFINED
SELECT 'INDEX CHECK' as check_type, indexname, tablename, 'EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. ADMIN USERS
SELECT 'ADMIN CHECK' as check_type, "Id", "Username", "Email", "Role" 
FROM "Users" 
WHERE "Role" = 'admin'
ORDER BY "CreatedAt" DESC;

-- 8. FORUM CATEGORIES
SELECT 'FORUM DATA' as check_type, "Id", "Name", "DisplayOrder", "IsActive"
FROM "Categories"
ORDER BY "DisplayOrder";

-- 9. ENUM VALUES (stored in columns as text)
SELECT 'ENUM CHECK' as check_type, 'User.Role', "Role", COUNT(*) as count FROM "Users" GROUP BY "Role"
UNION ALL
SELECT 'ENUM CHECK' as check_type, 'Cue.CueType', "CueType", COUNT(*) as count FROM "Cues" WHERE "CueType" IS NOT NULL GROUP BY "CueType"
UNION ALL
SELECT 'ENUM CHECK' as check_type, 'Cue.Condition', "Condition", COUNT(*) as count FROM "Cues" WHERE "Condition" IS NOT NULL GROUP BY "Condition"
UNION ALL
SELECT 'ENUM CHECK' as check_type, 'Message.ModerationStatus', "ModerationStatus", COUNT(*) as count FROM "Messages" WHERE "ModerationStatus" IS NOT NULL GROUP BY "ModerationStatus"
UNION ALL
SELECT 'ENUM CHECK' as check_type, 'Discussion.ModerationStatus', "ModerationStatus", COUNT(*) as count FROM "Discussions" WHERE "ModerationStatus" IS NOT NULL GROUP BY "ModerationStatus"
UNION ALL
SELECT 'ENUM CHECK' as check_type, 'Post.ModerationStatus', "ModerationStatus", COUNT(*) as count FROM "Posts" WHERE "ModerationStatus" IS NOT NULL GROUP BY "ModerationStatus";

-- 10. POTENTIAL DATA ISSUES
SELECT 'DATA ISSUE' as check_type, 'Users without email' as issue, COUNT(*) as count FROM "Users" WHERE "Email" IS NULL OR "Email" = ''
UNION ALL
SELECT 'DATA ISSUE' as check_type, 'Cues with no price' as issue, COUNT(*) as count FROM "Cues" WHERE "Price" IS NULL OR "Price" = 0
UNION ALL
SELECT 'DATA ISSUE' as check_type, 'Messages without recipient' as issue, COUNT(*) as count FROM "Messages" WHERE "RecipientId" IS NULL
UNION ALL
SELECT 'DATA ISSUE' as check_type, 'Discussions without creator' as issue, COUNT(*) as count FROM "Discussions" WHERE "CreatedByUserId" IS NULL
UNION ALL
SELECT 'DATA ISSUE' as check_type, 'Posts without creator' as issue, COUNT(*) as count FROM "Posts" WHERE "CreatedByUserId" IS NULL;

-- 11. MIGRATION HISTORY
SELECT 'MIGRATION' as check_type, "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";

SELECT 'MIGRATION' as check_type, "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory_Forum" ORDER BY "MigrationId";
