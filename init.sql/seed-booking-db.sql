BEGIN;

DELETE FROM "BilliardClubBookings";
DELETE FROM "BilliardClubTables";
DELETE FROM "BilliardClubLocations";
DELETE FROM "BilliardClubCoOwners";
DELETE FROM "BilliardClubRecords";

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
    '939a2c0f-a6ee-8ff3-abb3-acb1c31488c6',
    'Club Owner 01',
    'clubowner01@example.com',
    '+30 210 555 0101',
    'https://club-owner01.example.com',
    'https://placehold.co/200x100?text=Club+Owner+01',
    'Downtown club with premium tables and lounge area.',
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'a787a19d-91a1-1d43-b943-a9a5a6fec6f4',
    'Admin Club',
    'admin01@example.com',
    '+30 210 555 0202',
    'https://admin-club.example.com',
    'https://placehold.co/200x100?text=Admin+Club',
    'Luxury tables with VIP reservations and coaching.',
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'bf4ffba3-6f9a-f09c-9166-aa9c20cbc1ad',
    'Player Hub',
    'user01@example.com',
    '+30 210 555 0303',
    'https://player-hub.example.com',
    'https://placehold.co/200x100?text=Player+Hub',
    'Community-friendly venue with weekly tournaments.',
    NOW(),
    NOW()
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
    '11111111-aaaa-1111-aaaa-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Downtown Lounge',
    '12 Market Street',
    'Athens',
    'Attica',
    'Greece',
    '12:00-23:00',
    'Snacks and drinks available.',
    '37.9838',
    '23.7275',
    NOW(),
    NOW()
  ),
  (
    '11111111-bbbb-1111-bbbb-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'City Center Annex',
    '45 Central Ave',
    'Athens',
    'Attica',
    'Greece',
    '10:00-22:00',
    'Family-friendly hours.',
    '37.9850',
    '23.7300',
    NOW(),
    NOW()
  ),
  (
    '22222222-aaaa-2222-aaaa-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'VIP Hall',
    '88 Luxury Blvd',
    'Thessaloniki',
    'Central Macedonia',
    'Greece',
    '14:00-02:00',
    'Dress code enforced.',
    '40.6401',
    '22.9444',
    NOW(),
    NOW()
  ),
  (
    '33333333-aaaa-3333-aaaa-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Community Arena',
    '7 Player Road',
    'Patras',
    'Western Greece',
    'Greece',
    '11:00-21:00',
    'Weekly tournaments on Friday.',
    '38.2466',
    '21.7346',
    NOW(),
    NOW()
  );

INSERT INTO "BilliardClubTables" (
  "Id",
  "LocationId",
  "Name",
  "Notes",
  "CreatedAt"
) VALUES
  (
    'aaaaaaaa-1111-1111-1111-aaaaaaaa1111',
    '11111111-aaaa-1111-aaaa-111111111111',
    'Table A1',
    'Pro 9ft table',
    NOW()
  ),
  (
    'aaaaaaaa-1111-1111-1111-aaaaaaaa2222',
    '11111111-aaaa-1111-aaaa-111111111111',
    'Table A2',
    'Tournament cloth',
    NOW()
  ),
  (
    'bbbbbbbb-1111-1111-1111-bbbbbbbb1111',
    '11111111-bbbb-1111-bbbb-111111111111',
    'Table B1',
    'Beginner friendly',
    NOW()
  ),
  (
    'cccccccc-2222-2222-2222-cccccccc1111',
    '22222222-aaaa-2222-aaaa-222222222222',
    'VIP Table 1',
    'Private room',
    NOW()
  ),
  (
    'dddddddd-3333-3333-3333-dddddddd1111',
    '33333333-aaaa-3333-aaaa-333333333333',
    'Community Table',
    'Open play',
    NOW()
  );

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
    'eeeeeeee-1111-1111-1111-eeeeeeee1111',
    '11111111-1111-1111-1111-111111111111',
    'bf4ffba3-6f9a-f09c-9166-aa9c20cbc1ad',
    'user01',
    'user01@example.com',
    'approved',
    '939a2c0f-a6ee-8ff3-abb3-acb1c31488c6',
    NOW(),
    NOW()
  );

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
    'f1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-aaaa-1111-aaaa-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaa1111',
    'bf4ffba3-6f9a-f09c-9166-aa9c20cbc1ad',
    'User 01',
    'user01@example.com',
    '+30 699 000 1111',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day 2 hours',
    'confirmed',
    'Evening booking',
    NOW(),
    NOW()
  ),
  (
    'f2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '22222222-aaaa-2222-aaaa-222222222222',
    'cccccccc-2222-2222-2222-cccccccc1111',
    'a787a19d-91a1-1d43-b943-a9a5a6fec6f4',
    'Admin 01',
    'admin01@example.com',
    '+30 699 000 2222',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days 3 hours',
    'pending',
    'VIP customer',
    NOW(),
    NOW()
  ),
  (
    'f3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '33333333-aaaa-3333-aaaa-333333333333',
    'dddddddd-3333-3333-3333-dddddddd1111',
    '939a2c0f-a6ee-8ff3-abb3-acb1c31488c6',
    'Club Owner 01',
    'clubowner01@example.com',
    '+30 699 000 3333',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days 1 hour',
    'completed',
    'Training session',
    NOW(),
    NOW()
  );

COMMIT;
