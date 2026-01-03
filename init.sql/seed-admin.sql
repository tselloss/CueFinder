-- Seed Data for CueFinder Database
-- Creates an admin user for testing

-- Insert admin user (password is 'admin' hashed with BCrypt)
-- Note: You should use BCrypt.Net.BCrypt.HashPassword("admin") in C# to generate this
-- For now, we'll create via the API or update the seed method

INSERT INTO "Users" ("Username", "PasswordHash", "Name", "Email", "Phone", "Role", "IsEmailVerified", "IsActive", "CreatedAt", "UpdatedAt")
VALUES 
('admin', '$2a$11$8K1p/a0dL3LHmkHq5J5Z0uE.xmxZ1Z0YxCKqX4Y7Z8Z9Z0Z1Z2Z3Z', 'Admin User', 'admin@cuefinder.com', '+1234567890', 'admin', true, true, NOW(), NOW())
ON CONFLICT ("Username") DO NOTHING;

-- Note: The password hash above is a placeholder. 
-- The application should create the admin user on first run or via migration seed
