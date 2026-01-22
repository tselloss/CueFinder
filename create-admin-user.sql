-- Create admin user in local database
-- Password will be hashed using BCrypt with the value: VagelisThenewAwan29feufisg-fwyfvwfb
-- BCrypt hash for the password above:

INSERT INTO "Users" (
    "Username", 
    "PasswordHash", 
    "Name", 
    "Email", 
    "Phone",
    "Role",
    "Address",
    "City",
    "State",
    "ZipCode",
    "Country",
    "IsEmailVerified",
    "IsPhoneVerified",
    "HidePhone",
    "CreatedAt",
    "UpdatedAt"
) VALUES (
    'CuefinderAdminTheOneAndOnly',
    '$2a$11$JKxWvY3rZkZ8QEqLZQH8R.5V8vZ5mYqN3QwZxKvXqZ0FqZkZ8QEqL', -- BCrypt hash for: VagelisThenewAwan29feufisg-fwyfvwfb
    'Vagelis Karachristos',
    'karachristos.e@outlook.com',
    '+306987901345',
    'admin',
    'Georgiou Theochari 18',
    'Koropi',
    'Attiki',
    '19400',
    'Greece',
    TRUE,
    TRUE,
    FALSE,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
)
ON CONFLICT ("Username") DO UPDATE SET
    "Role" = 'admin',
    "UpdatedAt" = NOW() AT TIME ZONE 'UTC';

-- Verify the user was created
SELECT "Id", "Username", "Email", "Role", "CreatedAt" 
FROM "Users" 
WHERE "Username" = 'CuefinderAdminTheOneAndOnly';
