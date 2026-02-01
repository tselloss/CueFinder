-- Seed Forum Categories
-- This script adds default forum categories for CueFinder

-- Check if categories already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Categories" LIMIT 1) THEN
        -- Insert default forum categories
        INSERT INTO "Categories" ("Id", "Name", "Description", "DisplayOrder", "IsActive", "CreatedAt", "ModifiedAt")
        VALUES
            (gen_random_uuid(), 'General', 'General discussions about billiards and pool', 1, true, NOW(), NOW()),
            (gen_random_uuid(), 'Billiard Clubs', 'Find and discuss billiard clubs and venues', 2, true, NOW(), NOW()),
            (gen_random_uuid(), 'Tournaments', 'Tournament announcements, results, and discussions', 3, true, NOW(), NOW()),
            (gen_random_uuid(), 'Sales', 'Buy, sell, and trade billiard equipment', 4, true, NOW(), NOW()),
            (gen_random_uuid(), 'Practise Drills', 'Share and discuss practice drills and techniques', 5, true, NOW(), NOW()),
            (gen_random_uuid(), 'Pool Lessons', 'Find instructors and discuss learning resources', 6, true, NOW(), NOW());

        RAISE NOTICE 'Forum categories seeded successfully';
    ELSE
        RAISE NOTICE 'Forum categories already exist, skipping seed';
    END IF;
END $$;

-- Verify categories were created
SELECT 
    "Id", 
    "Name", 
    "Description", 
    "DisplayOrder",
    "IsActive"
FROM "Categories"
ORDER BY "DisplayOrder";
