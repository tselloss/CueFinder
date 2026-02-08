-- Create BilliardClubBookings table (Forum schema)
-- Mirrors migration 20260206152000_AddClubBookings

BEGIN;

CREATE TABLE IF NOT EXISTS "BilliardClubBookings" (
  "Id" uuid NOT NULL,
  "RecordId" uuid NOT NULL,
  "LocationId" uuid NOT NULL,
  "TableId" uuid NOT NULL,
  "CreatedByUserId" uuid NOT NULL,
  "CustomerName" character varying(200) NOT NULL,
  "CustomerEmail" character varying(200) NOT NULL,
  "CustomerPhone" character varying(50) NOT NULL,
  "StartTime" timestamp without time zone NOT NULL,
  "EndTime" timestamp without time zone NOT NULL,
  "Status" character varying(30) NOT NULL,
  "Notes" character varying(500) NOT NULL,
  "CreatedAt" timestamp without time zone NOT NULL,
  "UpdatedAt" timestamp without time zone NOT NULL,
  CONSTRAINT "PK_BilliardClubBookings" PRIMARY KEY ("Id"),
  CONSTRAINT "FK_BilliardClubBookings_BilliardClubLocations_LocationId" FOREIGN KEY ("LocationId") REFERENCES "BilliardClubLocations" ("Id") ON DELETE CASCADE,
  CONSTRAINT "FK_BilliardClubBookings_BilliardClubRecords_RecordId" FOREIGN KEY ("RecordId") REFERENCES "BilliardClubRecords" ("Id") ON DELETE CASCADE,
  CONSTRAINT "FK_BilliardClubBookings_BilliardClubTables_TableId" FOREIGN KEY ("TableId") REFERENCES "BilliardClubTables" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_BilliardClubBookings_CreatedByUserId" ON "BilliardClubBookings" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_BilliardClubBookings_LocationId" ON "BilliardClubBookings" ("LocationId");
CREATE INDEX IF NOT EXISTS "IX_BilliardClubBookings_RecordId" ON "BilliardClubBookings" ("RecordId");
CREATE INDEX IF NOT EXISTS "IX_BilliardClubBookings_StartTime" ON "BilliardClubBookings" ("StartTime");
CREATE INDEX IF NOT EXISTS "IX_BilliardClubBookings_TableId" ON "BilliardClubBookings" ("TableId");

-- Record forum migration history
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory_Forum" (
  "MigrationId" character varying(150) NOT NULL,
  "ProductVersion" character varying(32) NOT NULL,
  CONSTRAINT "PK___EFMigrationsHistory_Forum" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory_Forum" ("MigrationId", "ProductVersion")
VALUES ('20260206152000_AddClubBookings', '8.0.0')
ON CONFLICT DO NOTHING;

COMMIT;
