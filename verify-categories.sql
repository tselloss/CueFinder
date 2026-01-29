-- Verify Categories were seeded
SELECT COUNT(*) as total_categories FROM "Categories";
SELECT "Name", "DisplayOrder" FROM "Categories" ORDER BY "DisplayOrder";
