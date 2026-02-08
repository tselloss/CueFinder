-- Seed a club owner user and attach a club record to them
-- Safe to re-run

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO "Users" (
  "Username", "PasswordHash", "Name", "Email", "Phone",
  "Role", "IsEmailVerified", "IsActive", "IsPhoneVerified",
  "IsVerified", "AcceptedTerms", "HidePhone", "IsBanned",
  "CreatedAt", "UpdatedAt"
)
VALUES (
  'club_owner_demo',
  encode(digest('Password123!', 'sha256'), 'base64'),
  'Club Owner Demo',
  'clubowner@cuefinder.local',
  '+30000000999',
  'club_owner',
  true,
  true,
  false,
  true,
  true,
  false,
  false,
  (now() AT TIME ZONE 'UTC'),
  (now() AT TIME ZONE 'UTC')
)
ON CONFLICT ("Username") DO UPDATE
SET "Role" = 'club_owner',
    "IsActive" = true,
    "IsEmailVerified" = true,
    "PasswordHash" = EXCLUDED."PasswordHash",
    "Email" = EXCLUDED."Email",
    "Phone" = EXCLUDED."Phone",
    "UpdatedAt" = (now() AT TIME ZONE 'UTC');

DO $$
DECLARE
  owner_id INT;
  owner_guid UUID;
BEGIN
  SELECT "Id" INTO owner_id FROM "Users" WHERE "Username" = 'club_owner_demo';
  owner_guid := (substring(md5(owner_id::text), 1, 8) || '-' || substring(md5(owner_id::text), 9, 4) || '-' || substring(md5(owner_id::text), 13, 4) || '-' || substring(md5(owner_id::text), 17, 4) || '-' || substring(md5(owner_id::text), 21, 12))::uuid;

  UPDATE "BilliardClubRecords"
  SET "OwnerUserId" = owner_guid,
      "UpdatedAt" = (now() AT TIME ZONE 'UTC')
  WHERE "Id" = '11111111-1111-1111-1111-111111111111';
END $$;
