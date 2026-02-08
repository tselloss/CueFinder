-- Seed data for Billiard Club bookings (Forum schema)
-- Assumes migration AddClubBookings applied.

DELETE FROM "BilliardClubBookings" WHERE "Id" IN (
  '51111111-1111-1111-1111-111111111111',
  '51111111-1111-1111-1111-111111111112',
  '52222222-2222-2222-2222-222222222221',
  '53333333-3333-3333-3333-333333333331'
);

DO $$
DECLARE
  user1_id INT;
  user2_id INT;
  user1_guid UUID;
  user2_guid UUID;
BEGIN
  SELECT "Id" INTO user1_id FROM "Users" WHERE "Username" = 'demo_user1';
  SELECT "Id" INTO user2_id FROM "Users" WHERE "Username" = 'demo_user2';

  user1_guid := (substring(md5(user1_id::text), 1, 8) || '-' || substring(md5(user1_id::text), 9, 4) || '-' || substring(md5(user1_id::text), 13, 4) || '-' || substring(md5(user1_id::text), 17, 4) || '-' || substring(md5(user1_id::text), 21, 12))::uuid;
  user2_guid := (substring(md5(user2_id::text), 1, 8) || '-' || substring(md5(user2_id::text), 9, 4) || '-' || substring(md5(user2_id::text), 13, 4) || '-' || substring(md5(user2_id::text), 17, 4) || '-' || substring(md5(user2_id::text), 21, 12))::uuid;

  INSERT INTO "BilliardClubBookings" (
    "Id",
    "RecordId",
    "LocationId",
    "TableId",
    "CreatedByUserId",
    "CustomerName",
    "CustomerEmail",
    "CustomerPhone",
    "StartTime",
    "EndTime",
    "Status",
    "Notes",
    "CreatedAt",
    "UpdatedAt"
  ) VALUES
    (
      '51111111-1111-1111-1111-111111111111',
      '11111111-1111-1111-1111-111111111111',
      'aaaa1111-1111-1111-1111-111111111111',
      '31111111-1111-1111-1111-111111111111',
      COALESCE(user1_guid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
      'Nikos Papas',
      'nikos@example.com',
      '+30 690 111 2222',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day 14 hours',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day 15 hours',
      'confirmed',
      'Tournament practice booking.',
      NOW() AT TIME ZONE 'UTC',
      NOW() AT TIME ZONE 'UTC'
    ),
    (
      '51111111-1111-1111-1111-111111111112',
      '11111111-1111-1111-1111-111111111111',
      'aaaa1111-1111-1111-1111-111111111111',
      '31111111-1111-1111-1111-111111111112',
      COALESCE(user2_guid, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
      'Eleni Georgiou',
      'eleni@example.com',
      '+30 690 333 4444',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day 16 hours',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day 17 hours',
      'pending',
      'Birthday friendly match.',
      NOW() AT TIME ZONE 'UTC',
      NOW() AT TIME ZONE 'UTC'
    ),
    (
      '52222222-2222-2222-2222-222222222221',
      '11111111-1111-1111-1111-111111111111',
      'aaaa2222-2222-2222-2222-222222222222',
      '32222222-2222-2222-2222-222222222221',
      COALESCE(user2_guid, 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
      'Alex Dimitriou',
      'alex@example.com',
      '+30 690 555 6666',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '2 days 18 hours',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '2 days 20 hours',
      'cancelled',
      'Cancelled by customer.',
      NOW() AT TIME ZONE 'UTC',
      NOW() AT TIME ZONE 'UTC'
    ),
    (
      '53333333-3333-3333-3333-333333333331',
      '22222222-2222-2222-2222-222222222222',
      'bbbb1111-1111-1111-1111-111111111111',
      '33333333-3333-3333-3333-333333333331',
      COALESCE(user1_guid, '11111111-2222-3333-4444-555555555555'),
      'Maria Vasilou',
      'maria@example.com',
      '+30 690 777 8888',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '3 days 12 hours',
      (NOW() AT TIME ZONE 'UTC') + INTERVAL '3 days 13 hours',
      'confirmed',
      'Family booking with coaching.',
      NOW() AT TIME ZONE 'UTC',
      NOW() AT TIME ZONE 'UTC'
    );
END $$;
