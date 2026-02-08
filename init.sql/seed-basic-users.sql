-- Seed basic users (safe to re-run)
-- Passwords (SHA-256 base64):
--  user01 / ChangeMe123!
--  clubowner01 / ChangeMe123!
--  admin01 / ChangeMe123!

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO "Users" (
  "Username", "PasswordHash", "Name", "Email", "Phone",
  "Role", "IsEmailVerified", "IsActive", "IsPhoneVerified",
  "IsVerified", "AcceptedTerms", "HidePhone", "IsBanned",
  "CreatedAt", "UpdatedAt"
)
VALUES
  (
    'user01',
    encode(digest('ChangeMe123!', 'sha256'), 'base64'),
    'Simple User',
    'user01@example.com',
    '+30000000101',
    'user',
    true,
    true,
    false,
    true,
    true,
    false,
    false,
    (now() AT TIME ZONE 'UTC'),
    (now() AT TIME ZONE 'UTC')
  ),
  (
    'clubowner01',
    encode(digest('ChangeMe123!', 'sha256'), 'base64'),
    'Billiard Club Owner',
    'clubowner01@example.com',
    '+30000000102',
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
  ),
  (
    'admin01',
    encode(digest('ChangeMe123!', 'sha256'), 'base64'),
    'Admin User',
    'admin01@example.com',
    '+30000000103',
    'admin',
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
SET "Role" = EXCLUDED."Role",
    "IsActive" = true,
    "IsEmailVerified" = true,
    "PasswordHash" = EXCLUDED."PasswordHash",
    "Email" = EXCLUDED."Email",
    "Phone" = EXCLUDED."Phone",
    "UpdatedAt" = (now() AT TIME ZONE 'UTC');
