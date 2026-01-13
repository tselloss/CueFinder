START TRANSACTION;

ALTER TABLE "Users" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "Users" ALTER COLUMN "PhoneVerifiedAt" TYPE timestamp without time zone;

ALTER TABLE "Users" ALTER COLUMN "LastLoginAt" TYPE timestamp without time zone;

ALTER TABLE "Users" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "Users" ADD "AcceptedTerms" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Users" ADD "AcceptedTermsAt" timestamp without time zone;

ALTER TABLE "Transactions" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "Transactions" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "Transactions" ALTER COLUMN "CompletedAt" TYPE timestamp without time zone;

ALTER TABLE "SavedCues" ALTER COLUMN "SavedAt" TYPE timestamp without time zone;

ALTER TABLE "Ratings" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "Ratings" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "PhoneVerificationTokens" ALTER COLUMN "VerifiedAt" TYPE timestamp without time zone;

ALTER TABLE "PhoneVerificationTokens" ALTER COLUMN "LastResentAt" TYPE timestamp without time zone;

ALTER TABLE "PhoneVerificationTokens" ALTER COLUMN "ExpiresAt" TYPE timestamp without time zone;

ALTER TABLE "PhoneVerificationTokens" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "Messages" ALTER COLUMN "ReadAt" TYPE timestamp without time zone;

ALTER TABLE "Messages" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "Cues" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "Cues" ALTER COLUMN "SoldDate" TYPE timestamp without time zone;

ALTER TABLE "Cues" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "CueImages" ALTER COLUMN "UploadedAt" TYPE timestamp without time zone;

ALTER TABLE "CueCases" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "CueCases" ALTER COLUMN "SoldDate" TYPE timestamp without time zone;

ALTER TABLE "CueCases" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "CueCaseImages" ALTER COLUMN "UploadedAt" TYPE timestamp without time zone;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260113091802_AddCueTypeColumn', '8.0.0');

COMMIT;

