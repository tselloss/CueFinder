-- Create simple admin user for testing
-- Username: admin
-- Password: admin
-- BCrypt hash for "admin": $2a$11$3pKvJQz7zKZ8qEqLZQH8R.5V8vZ5mYqN3QwZxKvXqZ0FqZkZ8QEqL

INSERT INTO "Users" (
    "Username", 
    "PasswordHash", 
    "Name", 
    "Email", 
    "Phone",
    "Role",
    "IsEmailVerified",
    "IsPhoneVerified",
    "HidePhone",
    "IsActive",
    "CreatedAt",
    "UpdatedAt"
) VALUES (
    'admin',
    '$2a$11$3pKvJQz7zKZ8qEqLZQH8R.5V8vZ5mYqN3QwZxKvXqZ0FqZkZ8QEqL', -- BCrypt hash for: admin
    'Admin User',
    'admin@cuefinder.com',
    '',
    'admin',
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
)
ON CONFLICT ("Username") DO UPDATE SET
    "Role" = 'admin',
    "Email" = 'admin@cuefinder.com',
    "IsActive" = TRUE,
    "UpdatedAt" = NOW() AT TIME ZONE 'UTC';

-- Verify both admin users exist
SELECT "Id", "Username", "Email", "Role", "CreatedAt" 
FROM "Users" 
WHERE "Role" = 'admin'
ORDER BY "Id";
