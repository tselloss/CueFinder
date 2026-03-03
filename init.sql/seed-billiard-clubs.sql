-- Seed data for Billiard Clubs directory (Forum schema)
-- Assumes migrations AddBilliardClubRecords + AddClubTables applied.

DELETE FROM "BilliardClubTables" WHERE "LocationId" IN (
  'aaaa1111-1111-1111-1111-111111111111',
  'aaaa2222-2222-2222-2222-222222222222',
  'bbbb1111-1111-1111-1111-111111111111'
);

DELETE FROM "BilliardClubCoOwners" WHERE "RecordId" IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM "BilliardClubLocations" WHERE "RecordId" IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM "BilliardClubRecords" WHERE "Id" IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

INSERT INTO "BilliardClubRecords" (
  "Id",
  "OwnerUserId",
  "OwnerName",
  "OwnerEmail",
  "OwnerPhone",
  "Website",
  "SocialLink",
  "Description",
  "CreatedAt",
  "UpdatedAt"
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Athens Billiard Lounge',
    'owner@athenslounge.gr',
    '+30 210 555 0101',
    'https://athenslounge.gr',
    'https://instagram.com/athenslounge',
    'Premium tables, weekly leagues, and late-night tournaments.',
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Thessaloniki Cue House',
    'hello@cuehouse.gr',
    '+30 231 555 0202',
    'https://cuehouse.gr',
    'https://facebook.com/cuehouse',
    'Family-friendly club with coaching and practice sessions.',
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
  );

INSERT INTO "BilliardClubLocations" (
  "Id",
  "RecordId",
  "Name",
  "Address",
  "City",
  "Region",
  "Country",
  "OpeningHours",
  "SpecialNotes",
  "Latitude",
  "Longitude",
  "CreatedAt",
  "UpdatedAt"
) VALUES
  (
    'aaaa1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Athens Billiard Lounge - Center',
    '25 Ermou St',
    'Athens',
    'Attica',
    'Greece',
    'Mon-Fri 12:00-02:00, Sat-Sun 10:00-03:00',
    'Snack bar, coaching, weekly tournaments.',
    '37.9838',
    '23.7275',
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
  ),
  (
    'aaaa2222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Athens Billiard Lounge - North',
    '88 Kifisias Ave',
    'Marousi',
    'Attica',
    'Greece',
    'Mon-Fri 14:00-01:00, Sat-Sun 12:00-02:00',
    'VIP tables available, lounge seating.',
    '38.0500',
    '23.8083',
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
  ),
  (
    'bbbb1111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Cue House - Downtown',
    '15 Tsimiski St',
    'Thessaloniki',
    'Central Macedonia',
    'Greece',
    'Mon-Sun 11:00-01:00',
    'Family friendly, coaching sessions daily.',
    '40.6401',
    '22.9444',
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
  );

INSERT INTO "BilliardClubTables" (
  "Id",
  "LocationId",
  "Name",
  "Notes",
  "CreatedAt"
) VALUES
  ('31111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'Table 1 - Pro', '9ft tournament table', NOW() AT TIME ZONE 'UTC'),
  ('31111111-1111-1111-1111-111111111112', 'aaaa1111-1111-1111-1111-111111111111', 'Table 2 - Pro', '9ft tournament table', NOW() AT TIME ZONE 'UTC'),
  ('31111111-1111-1111-1111-111111111113', 'aaaa1111-1111-1111-1111-111111111111', 'Table 3', '8ft practice table', NOW() AT TIME ZONE 'UTC'),
  ('32222222-2222-2222-2222-222222222221', 'aaaa2222-2222-2222-2222-222222222222', 'VIP Table A', '9ft with private lighting', NOW() AT TIME ZONE 'UTC'),
  ('33333333-3333-3333-3333-333333333331', 'bbbb1111-1111-1111-1111-111111111111', 'Table 1', '8ft table', NOW() AT TIME ZONE 'UTC'),
  ('33333333-3333-3333-3333-333333333332', 'bbbb1111-1111-1111-1111-111111111111', 'Table 2', '8ft table', NOW() AT TIME ZONE 'UTC');

INSERT INTO "BilliardClubCoOwners" (
  "Id",
  "RecordId",
  "CoOwnerUserId",
  "CoOwnerUsername",
  "Email",
  "Status",
  "ApprovedByUserId",
  "ApprovedAt",
  "CreatedAt"
) VALUES
  (
    '41111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'george',
    'george@athenslounge.gr',
    'pending',
    NULL,
    NULL,
    NOW() AT TIME ZONE 'UTC'
  ),
  (
    '42222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'maria',
    'maria@cuehouse.gr',
    'approved',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
  );
