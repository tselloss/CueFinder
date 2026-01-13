-- Set user to admin role
UPDATE "Users" SET "Role" = 'admin' WHERE "Id" = 1;

-- Verify the update
SELECT "Id", "Username", "Role", "Email" FROM "Users" WHERE "Id" = 1;
