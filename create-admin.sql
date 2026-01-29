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
    "IsActive",
    "HidePhone",
    "IsBanned",
    "AcceptedTerms",
    "CreatedAt",
    "UpdatedAt"
) VALUES (
    'CuefinderAdminTheOneAndOnly',
    '$2a$11$JKxWvY3rZkZ8QEqLZQH8R.5V8vZ5mYqN3QwZxKvXqZ0FqZkZ8QEqL',
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
    TRUE,
    FALSE,
    FALSE,
    TRUE,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
)
ON CONFLICT ("Username") DO UPDATE SET
    "Role" = 'admin',
    "IsActive" = TRUE,
    "IsBanned" = FALSE,
    "UpdatedAt" = NOW() AT TIME ZONE 'UTC';

SELECT "Id", "Username", "Email", "Role", "IsActive" FROM "Users" WHERE "Username" = 'CuefinderAdminTheOneAndOnly';
