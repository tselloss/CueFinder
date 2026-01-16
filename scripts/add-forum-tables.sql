-- Forum System Tables Creation Script
-- Creates all necessary tables for the forum functionality

START TRANSACTION;

-- Create Categories table
CREATE TABLE IF NOT EXISTS "Categories" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(500) NOT NULL,
    "DisplayOrder" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp without time zone NOT NULL,
    "ModifiedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_Categories" PRIMARY KEY ("Id")
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Type" character varying(50) NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Message" text NOT NULL,
    "DiscussionId" uuid,
    "PostId" uuid,
    "TriggeredByUserId" uuid,
    "IsRead" boolean NOT NULL,
    "CreatedAt" timestamp without time zone NOT NULL,
    "ReadAt" timestamp without time zone,
    "ExpiresAt" timestamp without time zone,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id")
);

-- Create Discussions table
CREATE TABLE IF NOT EXISTS "Discussions" (
    "Id" uuid NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Content" text NOT NULL,
    "CreatedByUserId" uuid NOT NULL,
    "CategoryId" uuid NOT NULL,
    "ViewCount" integer NOT NULL,
    "ReplyCount" integer NOT NULL,
    "IsPinned" boolean NOT NULL,
    "IsLocked" boolean NOT NULL,
    "CreatedAt" timestamp without time zone NOT NULL,
    "ModifiedAt" timestamp without time zone NOT NULL,
    "LastReplyAt" timestamp without time zone,
    CONSTRAINT "PK_Discussions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Discussions_Categories_CategoryId" FOREIGN KEY ("CategoryId") 
        REFERENCES "Categories" ("Id") ON DELETE CASCADE
);

-- Create DiscussionSubscriptions table
CREATE TABLE IF NOT EXISTS "DiscussionSubscriptions" (
    "Id" uuid NOT NULL,
    "DiscussionId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "NotifyOnNewPost" boolean NOT NULL,
    "NotifyOnMention" boolean NOT NULL,
    "SubscribedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_DiscussionSubscriptions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DiscussionSubscriptions_Discussions_DiscussionId" FOREIGN KEY ("DiscussionId") 
        REFERENCES "Discussions" ("Id") ON DELETE CASCADE
);

-- Create DiscussionViews table
CREATE TABLE IF NOT EXISTS "DiscussionViews" (
    "Id" uuid NOT NULL,
    "DiscussionId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "ViewedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_DiscussionViews" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DiscussionViews_Discussions_DiscussionId" FOREIGN KEY ("DiscussionId") 
        REFERENCES "Discussions" ("Id") ON DELETE CASCADE
);

-- Create Posts table
CREATE TABLE IF NOT EXISTS "Posts" (
    "Id" uuid NOT NULL,
    "Content" text NOT NULL,
    "DiscussionId" uuid NOT NULL,
    "CreatedByUserId" uuid NOT NULL,
    "ReplyToPostId" uuid,
    "LikeCount" integer NOT NULL,
    "HelpfulCount" integer NOT NULL,
    "IsEdited" boolean NOT NULL,
    "CreatedAt" timestamp without time zone NOT NULL,
    "ModifiedAt" timestamp without time zone NOT NULL,
    "DeletedAt" timestamp without time zone,
    "DeletionReason" text,
    CONSTRAINT "PK_Posts" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Posts_Discussions_DiscussionId" FOREIGN KEY ("DiscussionId") 
        REFERENCES "Discussions" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Posts_Posts_ReplyToPostId" FOREIGN KEY ("ReplyToPostId") 
        REFERENCES "Posts" ("Id") ON DELETE RESTRICT
);

-- Create PostLikes table
CREATE TABLE IF NOT EXISTS "PostLikes" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "CreatedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_PostLikes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PostLikes_Posts_PostId" FOREIGN KEY ("PostId") 
        REFERENCES "Posts" ("Id") ON DELETE CASCADE
);

-- Create PostMentions table
CREATE TABLE IF NOT EXISTS "PostMentions" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "MentionedUserId" uuid NOT NULL,
    "CreatedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_PostMentions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PostMentions_Posts_PostId" FOREIGN KEY ("PostId") 
        REFERENCES "Posts" ("Id") ON DELETE CASCADE
);

-- Create indexes for Discussions
CREATE INDEX IF NOT EXISTS "IX_Discussions_CategoryId" ON "Discussions" ("CategoryId");
CREATE INDEX IF NOT EXISTS "IX_Discussions_CreatedAt" ON "Discussions" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Discussions_CreatedByUserId" ON "Discussions" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_Discussions_IsLocked" ON "Discussions" ("IsLocked");
CREATE INDEX IF NOT EXISTS "IX_Discussions_IsPinned" ON "Discussions" ("IsPinned");

-- Create indexes for DiscussionSubscriptions
CREATE UNIQUE INDEX IF NOT EXISTS "IX_DiscussionSubscriptions_DiscussionId_UserId" 
    ON "DiscussionSubscriptions" ("DiscussionId", "UserId");

-- Create indexes for DiscussionViews
CREATE UNIQUE INDEX IF NOT EXISTS "IX_DiscussionViews_DiscussionId_UserId" 
    ON "DiscussionViews" ("DiscussionId", "UserId");

-- Create indexes for Notifications
CREATE INDEX IF NOT EXISTS "IX_Notifications_CreatedAt" ON "Notifications" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead" ON "Notifications" ("UserId", "IsRead");

-- Create indexes for PostLikes
CREATE UNIQUE INDEX IF NOT EXISTS "IX_PostLikes_PostId_UserId" 
    ON "PostLikes" ("PostId", "UserId");

-- Create indexes for PostMentions
CREATE INDEX IF NOT EXISTS "IX_PostMentions_MentionedUserId" ON "PostMentions" ("MentionedUserId");
CREATE INDEX IF NOT EXISTS "IX_PostMentions_PostId" ON "PostMentions" ("PostId");

-- Create indexes for Posts
CREATE INDEX IF NOT EXISTS "IX_Posts_CreatedAt" ON "Posts" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_CreatedByUserId" ON "Posts" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_Posts_DeletedAt" ON "Posts" ("DeletedAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_DiscussionId" ON "Posts" ("DiscussionId");
CREATE INDEX IF NOT EXISTS "IX_Posts_ReplyToPostId" ON "Posts" ("ReplyToPostId");

-- Insert migration record into forum-specific history table
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory_Forum" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory_Forum" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory_Forum" ("MigrationId", "ProductVersion")
VALUES ('20260115091110_InitialForumCreate', '8.0.0')
ON CONFLICT DO NOTHING;

COMMIT;
