-- Test script to verify FlaggedImages table and UserId tracking

-- 1. Check table structure
\d "FlaggedImages"

-- 2. Check if there are any flagged images
SELECT COUNT(*) as total_flagged_images FROM "FlaggedImages";

-- 3. Show all flagged images with user information
SELECT 
    fi."Id",
    fi."UserId",
    u."Username",
    u."Email",
    u."IsBanned",
    fi."FlagReason",
    fi."AIConfidenceScore",
    fi."Status",
    fi."CueId",
    fi."CueCaseId",
    fi."FlaggedAt"
FROM "FlaggedImages" fi
LEFT JOIN "Users" u ON fi."UserId" = u."Id"
ORDER BY fi."FlaggedAt" DESC
LIMIT 20;

-- 4. Show users with flagged content count
SELECT 
    u."Id",
    u."Username",
    u."Email",
    u."IsBanned",
    COUNT(fi."Id") as flagged_count
FROM "Users" u
INNER JOIN "FlaggedImages" fi ON u."Id" = fi."UserId"
GROUP BY u."Id", u."Username", u."Email", u."IsBanned"
ORDER BY flagged_count DESC;

-- 5. Show banned users
SELECT 
    "Id",
    "Username",
    "Email",
    "IsBanned",
    "CreatedAt"
FROM "Users"
WHERE "IsBanned" = TRUE;
