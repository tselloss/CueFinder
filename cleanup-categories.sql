-- Delete duplicate categories, keeping only the oldest entry for each name
WITH KeepIds AS (
  SELECT DISTINCT ON ("Name") "Id"
  FROM "Categories"
  ORDER BY "Name", "CreatedAt" ASC
)
DELETE FROM "Categories"
WHERE "Id" NOT IN (SELECT "Id" FROM KeepIds);

-- Show results
SELECT "Name", COUNT(*) as count, MIN("CreatedAt") as oldest 
FROM "Categories" 
GROUP BY "Name" 
ORDER BY "DisplayOrder";
