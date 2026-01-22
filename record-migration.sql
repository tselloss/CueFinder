-- Record the AddModerationEntities migration as applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260121000000_AddModerationEntities', '8.0.0');

-- Verify the FlaggedImages table now exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'FlaggedImages';
