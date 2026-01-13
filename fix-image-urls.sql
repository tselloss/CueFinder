UPDATE "CueImages" 
SET "ImageUrl" = '/uploads/cues/' || SPLIT_PART(SPLIT_PART("ImageUrl", '/', 4), '_', 1) || '/' || SPLIT_PART("ImageUrl", '/', 4)
WHERE "ImageUrl" LIKE '/uploads/cues/%' 
  AND "ImageUrl" NOT LIKE '/uploads/cues/%/%';

SELECT "Id", "CueId", "ImageUrl" FROM "CueImages";
