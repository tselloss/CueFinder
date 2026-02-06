SELECT "Id", "Title", "CreatedAt", CURRENT_TIMESTAMP - "CreatedAt" as age_interval FROM "Cues" WHERE "UserId" = 2;
