-- Seed Forum Categories
-- Run this script to populate initial forum categories (idempotent)

INSERT INTO "Categories" ("Id", "Name", "Description", "DisplayOrder", "IsActive", "CreatedAt", "ModifiedAt")
VALUES
    (gen_random_uuid(), 'Billiard Clubs', 'Discuss billiard clubs, venues, and facilities around the world', 1, true, NOW(), NOW()),
    (gen_random_uuid(), 'Tournaments', 'Tournament announcements, results, and discussions', 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'Sales', 'Buy, sell, and trade cues and billiard equipment', 3, true, NOW(), NOW()),
    (gen_random_uuid(), 'Practise Drills', 'Share and discuss practice drills and training routines', 4, true, NOW(), NOW()),
    (gen_random_uuid(), 'Pool Lessons', 'Find instructors, share tips, and discuss learning techniques', 5, true, NOW(), NOW()),
    (gen_random_uuid(), 'General', 'General billiards discussion and community chat', 6, true, NOW(), NOW())
ON CONFLICT ("Name") DO NOTHING;
