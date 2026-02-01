-- Database Integrity Verification Script
-- Run this regularly to ensure no data has been accidentally deleted
-- Usage: docker exec cuefinder-postgres psql -U postgres -d cuefinder -f verify-database-integrity.sql

\echo '=========================================='
\echo 'CueFinder Database Integrity Report'
\echo '=========================================='
\echo ''

-- Show database size
\echo '📊 Database Size:'
SELECT datname, pg_size_pretty(pg_database_size(datname)) as size 
FROM pg_database WHERE datname='cuefinder';
\echo ''

-- Show table counts
\echo '📈 Critical Table Row Counts:'
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count,
    MAX(created_at) as newest_record
FROM users
UNION ALL
SELECT 'forumcategories', COUNT(*), MAX(created_at) FROM forumcategories
UNION ALL
SELECT 'forumposts', COUNT(*), MAX(created_at) FROM forumposts
UNION ALL
SELECT 'cues', COUNT(*), MAX(created_at) FROM cues
UNION ALL
SELECT 'cuecases', COUNT(*), MAX(created_at) FROM cuecases
UNION ALL
SELECT 'ratings', COUNT(*), MAX(created_at) FROM ratings
UNION ALL
SELECT 'images', COUNT(*), MAX(created_at) FROM images
ORDER BY row_count DESC;
\echo ''

-- Check for orphaned records
\echo '🔍 Checking for Data Integrity Issues:'

\echo '  Checking forumposts with invalid category_id...'
SELECT COUNT(*) as orphaned_posts FROM forumposts 
WHERE category_id NOT IN (SELECT id FROM forumcategories);

\echo '  Checking forumposts with invalid user_id...'
SELECT COUNT(*) as orphaned_posts FROM forumposts 
WHERE user_id NOT IN (SELECT id FROM users);

\echo '  Checking cues with invalid user_id...'
SELECT COUNT(*) as orphaned_cues FROM cues 
WHERE user_id NOT IN (SELECT id FROM users);

\echo '  Checking cuecases with invalid user_id...'
SELECT COUNT(*) as orphaned_cases FROM cuecases 
WHERE user_id NOT IN (SELECT id FROM users);

\echo ''

-- Show schema details
\echo '📋 Table Schemas:'
\dt+ public.*

\echo ''

-- Show recent users
\echo '👥 Recently Created Users (last 5):'
SELECT id, email, username, created_at FROM users 
ORDER BY created_at DESC LIMIT 5;
\echo ''

-- Show table sizes
\echo '💾 Table Sizes:'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
\echo ''

-- Show indexes
\echo '🔑 Database Indexes:'
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname='public'
ORDER BY tablename, indexname;
\echo ''

-- Check for missing primary keys
\echo '⚠️  Checking for tables without primary keys:'
SELECT 
    t.relname as table_name
FROM pg_class t
JOIN pg_namespace s ON (t.relnamespace = s.oid)
WHERE s.nspname = 'public' 
AND t.relkind = 'r'
AND NOT EXISTS (
    SELECT 1 FROM pg_constraint c 
    WHERE c.conrelid = t.oid 
    AND c.contype = 'p'
)
ORDER BY t.relname;
\echo ''

-- Show foreign keys
\echo '🔗 Foreign Key Relationships:'
SELECT
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
    ON rc.constraint_name = kcu.constraint_name
JOIN information_schema.key_column_usage kcu2 
    ON rc.unique_constraint_name = kcu2.constraint_name
WHERE rc.constraint_schema = 'public'
ORDER BY table_name, column_name;
\echo ''

-- Check for NULL in critical fields
\echo '❌ Checking for NULL values in critical fields:'
SELECT 
    'users.email' as field,
    COUNT(*) as null_count
FROM users WHERE email IS NULL
UNION ALL
SELECT 'users.username', COUNT(*) FROM users WHERE username IS NULL
UNION ALL
SELECT 'forumposts.content', COUNT(*) FROM forumposts WHERE content IS NULL
UNION ALL
SELECT 'cues.name', COUNT(*) FROM cues WHERE name IS NULL
UNION ALL
SELECT 'cuecases.name', COUNT(*) FROM cuecases WHERE name IS NULL
HAVING COUNT(*) > 0;
\echo ''

-- Database transaction log (if available)
\echo '📝 Recent Changes Summary:'
SELECT 
    'Last backup' as info,
    (SELECT MAX(created_at)::text FROM audit_log LIMIT 1) as value
UNION ALL
SELECT 'Total users', COUNT(*)::text FROM users
UNION ALL
SELECT 'Total forum posts', COUNT(*)::text FROM forumposts
UNION ALL
SELECT 'Total cues', COUNT(*)::text FROM cues;
\echo ''

\echo '=========================================='
\echo 'Report Complete'
\echo '=========================================='
