-- Validate NOT VALID FK constraints added earlier. Run only after verification_status.txt == OK

ALTER TABLE "Notifications" VALIDATE CONSTRAINT "FK_Notifications_Users_UserId";
ALTER TABLE "Notifications" VALIDATE CONSTRAINT "FK_Notifications_Users_TriggeredByUserId";
ALTER TABLE "Discussions" VALIDATE CONSTRAINT "FK_Discussions_Users_CreatedByUserId";
ALTER TABLE "DiscussionSubscriptions" VALIDATE CONSTRAINT "FK_DiscussionSubscriptions_Users_UserId";
ALTER TABLE "DiscussionViews" VALIDATE CONSTRAINT "FK_DiscussionViews_Users_UserId";
ALTER TABLE "Posts" VALIDATE CONSTRAINT "FK_Posts_Users_CreatedByUserId";
ALTER TABLE "PostLikes" VALIDATE CONSTRAINT "FK_PostLikes_Users_UserId";
ALTER TABLE "PostMentions" VALIDATE CONSTRAINT "FK_PostMentions_Users_MentionedUserId";
