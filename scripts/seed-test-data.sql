-- Seed test data for CueFinder (safe to re-run)
-- Creates admin + demo users and populates core tables if empty

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin user (from admin-user.json)
INSERT INTO "Users" (
  "Username", "PasswordHash", "Name", "Email", "Phone",
  "Role", "IsEmailVerified", "IsActive", "IsPhoneVerified",
  "IsVerified", "AcceptedTerms", "HidePhone", "IsBanned",
  "Address", "City", "State", "ZipCode", "Country",
  "CreatedAt", "UpdatedAt"
)
VALUES (
  'CuefinderAdminTheOneAndOnly',
  encode(digest('VagelisThenewAwan29feufisg-fwyfvwfb', 'sha256'), 'base64'),
  'VagelisKarachristos',
  'karachristos.e@outlook.com',
  '+306987901345',
  'admin',
  true,
  true,
  false,
  true,
  true,
  false,
  false,
  'Georgiou Theochari 18',
  'Koropi',
  'Attiki',
  '19400',
  'Greece',
  (now() AT TIME ZONE 'UTC'),
  (now() AT TIME ZONE 'UTC')
)
ON CONFLICT ("Username") DO UPDATE
SET "Role" = 'admin',
    "IsActive" = true,
    "IsEmailVerified" = true,
    "PasswordHash" = EXCLUDED."PasswordHash",
    "Email" = EXCLUDED."Email",
    "Phone" = EXCLUDED."Phone",
    "UpdatedAt" = (now() AT TIME ZONE 'UTC');

-- Demo users
INSERT INTO "Users" (
  "Username", "PasswordHash", "Name", "Email", "Phone",
  "Role", "IsEmailVerified", "IsActive", "IsPhoneVerified",
  "IsVerified", "AcceptedTerms", "HidePhone", "IsBanned",
  "CreatedAt", "UpdatedAt"
)
VALUES
  ('demo_user1', encode(digest('Password123!', 'sha256'), 'base64'), 'Demo User One', 'demo1@cuefinder.local', '+30000000001', 'user', true, true, false, true, true, false, false, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')),
  ('demo_user2', encode(digest('Password123!', 'sha256'), 'base64'), 'Demo User Two', 'demo2@cuefinder.local', '+30000000002', 'user', true, true, false, true, true, false, false, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'))
ON CONFLICT ("Username") DO NOTHING;

DO $$
DECLARE
  admin_id INT;
  user1_id INT;
  user2_id INT;
  cue_id INT;
  cuecase_id INT;
  table_id INT;
  accessory_id INT;
  flagged_id INT;
  discussion_id UUID;
  post_id UUID;
  forum_user_id UUID := uuid_generate_v4();
  forum_user2_id UUID := uuid_generate_v4();
  category_id UUID;
BEGIN
  SELECT "Id" INTO admin_id FROM "Users" WHERE "Username" = 'CuefinderAdminTheOneAndOnly';
  SELECT "Id" INTO user1_id FROM "Users" WHERE "Username" = 'demo_user1';
  SELECT "Id" INTO user2_id FROM "Users" WHERE "Username" = 'demo_user2';

  -- Categories
  IF NOT EXISTS (SELECT 1 FROM "Categories") THEN
    INSERT INTO "Categories" ("Id", "Name", "Description", "DisplayOrder", "IsActive", "CreatedAt", "ModifiedAt")
    VALUES
      (uuid_generate_v4(), 'Billiard Clubs', 'Local clubs and communities', 1, true, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')),
      (uuid_generate_v4(), 'Sales', 'Buy, sell, and trade gear', 2, true, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'));
  END IF;

  SELECT "Id" INTO category_id FROM "Categories" ORDER BY "DisplayOrder" LIMIT 1;

  -- Cues
  IF NOT EXISTS (SELECT 1 FROM "Cues") THEN
    INSERT INTO "Cues" (
      "Title", "Brand", "Description", "Price", "CueType",
      "Condition", "Location", "IsSold", "UserId",
      "ViewCount", "AverageRating", "RatingCount",
      "CreatedAt", "UpdatedAt"
    ) VALUES
      ('Predator P3', 'Predator', 'Low-deflection shaft, excellent control.', 420.00, 'Playing', 'Excellent', 'Athens, GR', false, user1_id, 25, 4.8, 12, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')),
      ('Meucci Originals', 'Meucci', 'Classic maple cue, smooth hit.', 310.00, 'Playing', 'Very Good', 'Thessaloniki, GR', false, user2_id, 12, 4.5, 8, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'));
  END IF;

  SELECT "Id" INTO cue_id FROM "Cues" ORDER BY "Id" LIMIT 1;

  -- Cue Cases
  IF NOT EXISTS (SELECT 1 FROM "CueCases") THEN
    INSERT INTO "CueCases" (
      "Title", "Brand", "Description", "Price", "CaseCapacity", "CaseOpening", "CaseType",
      "Color", "CaseMaterial", "Condition", "Location", "IsSold", "UserId",
      "ViewCount", "AverageRating", "RatingCount", "CreatedAt", "UpdatedAt"
    ) VALUES
      ('Predator Roadline 3x5', 'Predator', 'Lightweight hard case with backpack straps.', 249.99, '3x5', 'Top', 'Hard', 'Black', 'ABS', 'Excellent', 'Athens, GR', false, user1_id, 6, 4.6, 4, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'));
  END IF;

  SELECT "Id" INTO cuecase_id FROM "CueCases" ORDER BY "Id" LIMIT 1;

  -- Billiard Tables
  IF NOT EXISTS (SELECT 1 FROM "BilliardTables") THEN
    INSERT INTO "BilliardTables" (
      "Title", "Brand", "Description", "Price", "TableSize", "TableType", "PlayingSurface",
      "FeltType", "FrameMaterial", "Condition", "Location", "IsSold", "UserId",
      "ViewCount", "AverageRating", "RatingCount", "CreatedAt", "UpdatedAt"
    ) VALUES
      ('Brunswick Gold Crown', 'Brunswick', 'Tournament-size table with premium rails.', 3200, '9ft', 'Tournament', 'Slate', 'Simonis 860', 'Solid Wood', 'Excellent', 'Athens, GR', false, user1_id, 3, 4.9, 5, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'));
  END IF;

  SELECT "Id" INTO table_id FROM "BilliardTables" ORDER BY "Id" LIMIT 1;

  -- Accessories
  IF NOT EXISTS (SELECT 1 FROM "Accessories") THEN
    INSERT INTO "Accessories" (
      "Title", "Brand", "Description", "Price", "Condition", "AccessoryType",
      "Material", "Size", "Color", "Location", "IsSold", "UserId",
      "ViewCount", "AverageRating", "RatingCount", "CreatedAt", "UpdatedAt"
    ) VALUES
      ('Kamui Tip Set', 'Kamui', 'Set of 3 medium tips for precise control.', 45.00, 'New', 'Tip', 'Leather', 'M', 'Black', 'Athens, GR', false, user2_id, 9, 4.7, 3, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'));
  END IF;

  SELECT "Id" INTO accessory_id FROM "Accessories" ORDER BY "Id" LIMIT 1;

  -- Images
  IF NOT EXISTS (SELECT 1 FROM "CueImages") THEN
    INSERT INTO "CueImages" ("CueId", "ImageUrl", "DisplayOrder", "IsPrimary")
    VALUES (cue_id, 'https://picsum.photos/seed/cue/800/600', 1, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "CueCaseImages") THEN
    INSERT INTO "CueCaseImages" ("CueCaseId", "ImageUrl", "DisplayOrder", "IsPrimary")
    VALUES (cuecase_id, 'https://picsum.photos/seed/case/800/600', 1, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "AccessoryImages") THEN
    INSERT INTO "AccessoryImages" ("AccessoryId", "ImageUrl", "DisplayOrder", "IsPrimary")
    VALUES (accessory_id, 'https://picsum.photos/seed/accessory/800/600', 1, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "BilliardTableImages") THEN
    INSERT INTO "BilliardTableImages" ("BilliardTableId", "ImageUrl", "DisplayOrder", "IsPrimary")
    VALUES (table_id, 'https://picsum.photos/seed/table/800/600', 1, true);
  END IF;

  -- Discussions
  IF NOT EXISTS (SELECT 1 FROM "Discussions") THEN
    discussion_id := uuid_generate_v4();
    INSERT INTO "Discussions" (
      "Id", "Title", "Content", "CreatedByUserId", "CategoryId",
      "ViewCount", "ReplyCount", "IsPinned", "IsLocked",
      "CreatedAt", "ModifiedAt", "CreatedByUsername"
    ) VALUES (
      discussion_id, 'Welcome to CueFinder', 'Share your best cue tips here!', forum_user_id, category_id,
      12, 1, false, false, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'), 'ForumUser'
    );
  ELSE
    SELECT "Id" INTO discussion_id FROM "Discussions" LIMIT 1;
  END IF;

  -- Posts
  IF NOT EXISTS (SELECT 1 FROM "Posts") THEN
    post_id := uuid_generate_v4();
    INSERT INTO "Posts" (
      "Id", "Content", "DiscussionId", "CreatedByUserId",
      "LikeCount", "HelpfulCount", "IsEdited", "CreatedAt", "ModifiedAt", "CreatedByUsername"
    ) VALUES (
      post_id, 'This community is awesome!', discussion_id, forum_user2_id,
      1, 0, false, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'), 'ForumUser2'
    );
  ELSE
    SELECT "Id" INTO post_id FROM "Posts" LIMIT 1;
  END IF;

  -- Discussion Subscriptions/Views
  IF NOT EXISTS (SELECT 1 FROM "DiscussionSubscriptions") THEN
    INSERT INTO "DiscussionSubscriptions" ("Id", "DiscussionId", "UserId", "NotifyOnNewPost", "NotifyOnMention", "SubscribedAt")
    VALUES (uuid_generate_v4(), discussion_id, forum_user_id, true, true, (now() AT TIME ZONE 'UTC'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "DiscussionViews") THEN
    INSERT INTO "DiscussionViews" ("Id", "DiscussionId", "UserId", "ViewedAt")
    VALUES (uuid_generate_v4(), discussion_id, forum_user_id, (now() AT TIME ZONE 'UTC'));
  END IF;

  -- Post Likes & Mentions
  IF NOT EXISTS (SELECT 1 FROM "PostLikes") THEN
    INSERT INTO "PostLikes" ("Id", "PostId", "UserId", "CreatedAt")
    VALUES (uuid_generate_v4(), post_id, forum_user_id, (now() AT TIME ZONE 'UTC'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "PostMentions") THEN
    INSERT INTO "PostMentions" ("Id", "PostId", "MentionedUserId", "CreatedAt")
    VALUES (uuid_generate_v4(), post_id, forum_user2_id, (now() AT TIME ZONE 'UTC'));
  END IF;

  -- Notifications
  IF NOT EXISTS (SELECT 1 FROM "Notifications") THEN
    INSERT INTO "Notifications" ("Id", "UserId", "Type", "Title", "Message", "DiscussionId", "PostId", "TriggeredByUserId", "IsRead", "CreatedAt")
    VALUES (uuid_generate_v4(), forum_user_id, 'forum', 'New Reply', 'You have a new reply', discussion_id, post_id, forum_user2_id, false, (now() AT TIME ZONE 'UTC'));
  END IF;

  -- Flagged Images
  IF NOT EXISTS (SELECT 1 FROM "FlaggedImages") THEN
    INSERT INTO "FlaggedImages" (
      "ImageHash", "FileName", "StoragePath", "CueId", "UserId",
      "FlagReason", "AIConfidenceScore", "IsAIFlagged", "Status", "AdminUserId"
    ) VALUES (
      encode(digest('seed-image', 'sha256'), 'hex'),
      'seed-image.jpg',
      '/uploads/seed-image.jpg',
      cue_id,
      user2_id,
      'nsfw',
      0.91,
      true,
      'pending',
      admin_id
    );
  END IF;

  SELECT "Id" INTO flagged_id FROM "FlaggedImages" ORDER BY "Id" LIMIT 1;

  -- Moderation Queue
  IF NOT EXISTS (SELECT 1 FROM "ModerationQueues") THEN
    INSERT INTO "ModerationQueues" ("FlaggedImageId", "Priority", "UserReportCount", "IsBeingReviewed")
    VALUES (flagged_id, 2, 1, false);
  END IF;

  -- User Reports
  IF NOT EXISTS (SELECT 1 FROM "UserReports") THEN
    INSERT INTO "UserReports" ("ReportingUserId", "FlaggedImageId", "ReportReason")
    VALUES (user1_id, flagged_id, 'Inappropriate content');
  END IF;

  -- Messages
  IF NOT EXISTS (SELECT 1 FROM "Messages") THEN
    INSERT INTO "Messages" (
      "SenderId", "RecipientId", "CueId", "Subject", "Content",
      "IsRead", "MessageType"
    ) VALUES (
      user1_id, user2_id, cue_id, 'Interested in your cue', 'Is this still available?', false, 'general'
    );
  END IF;

  -- Transactions
  IF NOT EXISTS (SELECT 1 FROM "Transactions") THEN
    INSERT INTO "Transactions" (
      "CueId", "SellerId", "BuyerId", "SalePrice", "Status",
      "ShippingMethod", "ShippingCost", "PaymentMethod", "TransactionNumber"
    ) VALUES (
      cue_id, user1_id, user2_id, 399.00, 'completed', 'Courier', 15.00, 'Card',
      CONCAT('TX-', EXTRACT(EPOCH FROM now())::bigint)
    );
  END IF;

  -- Ratings
  IF NOT EXISTS (SELECT 1 FROM "Ratings") THEN
    INSERT INTO "Ratings" ("CueId", "RatedByUserId", "SellerUserId", "RatingValue", "ReviewText")
    VALUES (cue_id, user2_id, user1_id, 5, 'Great seller and fast shipping');
  END IF;

  -- Saved Cues & Tables
  IF NOT EXISTS (SELECT 1 FROM "SavedCues") THEN
    INSERT INTO "SavedCues" ("UserId", "CueId", "Note")
    VALUES (user2_id, cue_id, 'Favorite cue');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "SavedBilliardTables") THEN
    INSERT INTO "SavedBilliardTables" ("UserId", "BilliardTableId")
    VALUES (user2_id, table_id);
  END IF;

  -- Phone Verification Tokens
  IF NOT EXISTS (SELECT 1 FROM "PhoneVerificationTokens") THEN
    INSERT INTO "PhoneVerificationTokens" (
      "UserId", "PhoneNumber", "Token", "MagicLinkToken", "VerificationCode",
      "VerificationMethod", "IsUsed", "IsVerified", "CreatedAt", "ExpiresAt",
      "AttemptCount", "MaxAttempts"
    ) VALUES (
      user1_id, '+30000000001',
      encode(digest(CONCAT('token-', now()), 'sha256'), 'hex'),
      encode(digest(CONCAT('magic-', now()), 'sha256'), 'hex'),
      '123456',
      'SMS', false, false, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC') + interval '1 day',
      0, 5
    );
  END IF;

END $$;
