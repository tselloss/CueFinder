-- Create test old listings (30+ days old) for admin user (Id = 2)
-- User: karachristos.e@outlook.com

-- Create test Cues (35 days old, 40 days old)
INSERT INTO "Cues" ("UserId", "Title", "Brand", "Description", "CueType", "Length", "Condition", "Price", "CreatedAt", "UpdatedAt", "IsSold", "Location", "ViewCount", "AverageRating", "RatingCount", "IsFlagged", "ModerationStatus")
VALUES
  (2, 'Premium Maple Cue - 35 Days Old', 'Predator', 'Professional grade maple cue, excellent condition, 58 inches', 'Break', 58, 'Excellent', 250.00, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', false, 'New York', 0, 0, 0, false, 'Approved'),
  (2, 'Antique Wood Cue - 40 Days Old', 'Brunswick', 'Vintage cue with beautiful wood grain, needs slight refinishing', 'Jump', 57, 'Good', 180.00, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', false, 'California', 0, 0, 0, false, 'Approved');

-- Create test Cases (32 days old, 38 days old)
INSERT INTO "CueCases" ("UserId", "Title", "Brand", "Description", "CaseType", "CaseCapacity", "CaseOpening", "Condition", "Price", "CreatedAt", "UpdatedAt", "IsSold", "Location", "ViewCount", "AverageRating", "RatingCount", "IsFlagged", "ModerationStatus")
VALUES
  (2, 'Hard Travel Case - 32 Days Old', 'McDermott', 'Durable hard shell case for 2 cues, airline approved', 'Travel', 2, 'Side', 'Like New', 120.00, NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days', false, 'Texas', 0, 0, 0, false, 'Approved'),
  (2, 'Soft Leather Case - 38 Days Old', 'Lucasi', 'Premium leather case for 1 cue, handcrafted', 'Leather', 1, 'Top', 'Good', 95.00, NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days', false, 'Florida', 0, 0, 0, false, 'Approved');

-- Create test Billiard Tables (36 days old, 42 days old)
INSERT INTO "BilliardTables" ("UserId", "Title", "Brand", "Description", "TableSize", "TableType", "PlayingSurface", "FeltType", "FrameMaterial", "Condition", "Price", "CreatedAt", "UpdatedAt", "IsSold", "Location", "ViewCount", "AverageRating", "RatingCount", "IsFlagged", "ModerationStatus")
VALUES
  (2, 'Professional 9-Foot Pool Table - 36 Days Old', 'Brunswick', 'Tournament grade table, slate bed, barely used', '9ft', 'Pool', 'Slate', 'Simonis', 'Wood', 'Excellent', 2500.00, NOW() - INTERVAL '36 days', NOW() - INTERVAL '36 days', false, 'Illinois', 0, 0, 0, false, 'Approved'),
  (2, 'Compact Billiard Table - 42 Days Old', 'Valley', 'Great for game room, 7-foot slate surface', '7ft', 'Pool', 'Slate', 'Standard', 'Wood', 'Good', 1200.00, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days', false, 'Michigan', 0, 0, 0, false, 'Approved');

-- Verify the inserts
SELECT 'TEST OLD LISTINGS CREATED SUCCESSFULLY!' as result;
SELECT 'Total 30+ day old unsold Cues:' as type, COUNT(*) as count FROM "Cues" WHERE "UserId" = 2 AND "IsSold" = false AND "CreatedAt" < NOW() - INTERVAL '29 days'
UNION ALL
SELECT 'Total 30+ day old unsold Cases:', COUNT(*) FROM "CueCases" WHERE "UserId" = 2 AND "IsSold" = false AND "CreatedAt" < NOW() - INTERVAL '29 days'
UNION ALL
SELECT 'Total 30+ day old unsold Tables:', COUNT(*) FROM "BilliardTables" WHERE "UserId" = 2 AND "IsSold" = false AND "CreatedAt" < NOW() - INTERVAL '29 days'
UNION ALL
SELECT 'Total 30+ day old unsold Accessories:', COUNT(*) FROM "Accessories" WHERE "UserId" = 2 AND "IsSold" = false AND "CreatedAt" < NOW() - INTERVAL '29 days';
