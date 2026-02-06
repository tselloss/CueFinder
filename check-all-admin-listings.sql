-- Check all listings for user ID 2 (admin)

-- Cues
SELECT 'CUES' as type, "Id", "Title", "CreatedAt", "IsSold", "UserId", 
       CURRENT_TIMESTAMP - "CreatedAt" as age
FROM "Cues" 
WHERE "UserId" = 2 
ORDER BY "CreatedAt";

-- Cases
SELECT 'CASES' as type, "Id", "Title", "CreatedAt", "IsSold", "UserId",
       CURRENT_TIMESTAMP - "CreatedAt" as age
FROM "CueCases" 
WHERE "UserId" = 2 
ORDER BY "CreatedAt";

-- Tables
SELECT 'TABLES' as type, "Id", "Title", "CreatedAt", "IsSold", "UserId",
       CURRENT_TIMESTAMP - "CreatedAt" as age
FROM "BilliardTables" 
WHERE "UserId" = 2 
ORDER BY "CreatedAt";

-- Accessories
SELECT 'ACCESSORIES' as type, "Id", "Title", "CreatedAt", "IsSold", "UserId",
       CURRENT_TIMESTAMP - "CreatedAt" as age
FROM "Accessories" 
WHERE "UserId" = 2 
ORDER BY "CreatedAt";
