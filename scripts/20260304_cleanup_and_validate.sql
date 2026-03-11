-- Cleanup and validate script
-- Attempts safe, non-destructive cleanup for nullable orphaned references,
-- reports non-nullable orphan rows for manual remediation, and validates
-- NOT VALID FK constraints added earlier when it is safe to do so.

DO $$
DECLARE
  cnt_notifications_userid int;
  cnt_notifications_triggeredby int;
  cnt_discussions_createdby int;
  cnt_posts_createdby int;
  cnt_postlikes_userid int;
  cnt_postmentions_mentioneduser int;
  remaining_orphans int;
  constraint_names text[] := array[
    'FK_Notifications_Users_UserId',
    'FK_Notifications_Users_TriggeredByUserId',
    'FK_Discussions_Users_CreatedByUserId',
    'FK_DiscussionSubscriptions_Users_UserId',
    'FK_DiscussionViews_Users_UserId',
    'FK_Posts_Users_CreatedByUserId',
    'FK_PostLikes_Users_UserId',
    'FK_PostMentions_Users_MentionedUserId'
  ];
  t text;
BEGIN
  -- Count orphans for each relation (joins on "Users" table)
  EXECUTE 'SELECT COUNT(*) FROM "Notifications" n LEFT JOIN "Users" u ON n."UserId" = u."Id" WHERE u."Id" IS NULL' INTO cnt_notifications_userid;
  EXECUTE 'SELECT COUNT(*) FROM "Notifications" n LEFT JOIN "Users" u ON n."TriggeredByUserId" = u."Id" WHERE n."TriggeredByUserId" IS NOT NULL AND u."Id" IS NULL' INTO cnt_notifications_triggeredby;
  EXECUTE 'SELECT COUNT(*) FROM "Discussions" d LEFT JOIN "Users" u ON d."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL' INTO cnt_discussions_createdby;
  EXECUTE 'SELECT COUNT(*) FROM "Posts" p LEFT JOIN "Users" u ON p."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL' INTO cnt_posts_createdby;
  EXECUTE 'SELECT COUNT(*) FROM "PostLikes" pl LEFT JOIN "Users" u ON pl."UserId" = u."Id" WHERE u."Id" IS NULL' INTO cnt_postlikes_userid;
  EXECUTE 'SELECT COUNT(*) FROM "PostMentions" pm LEFT JOIN "Users" u ON pm."MentionedUserId" = u."Id" WHERE u."Id" IS NULL' INTO cnt_postmentions_mentioneduser;

  RAISE NOTICE 'Orphan counts: Notifications.UserId=% , Notifications.TriggeredBy=% , Discussions=% , Posts=% , PostLikes=% , PostMentions=%',
    cnt_notifications_userid, cnt_notifications_triggeredby, cnt_discussions_createdby, cnt_posts_createdby, cnt_postlikes_userid, cnt_postmentions_mentioneduser;

  -- Attempt safe fixes: set nullable FK columns to NULL where possible.
  -- Notifications.TriggeredByUserId is nullable in our DDL; set to NULL for orphaned rows.
  IF cnt_notifications_triggeredby > 0 THEN
    EXECUTE 'UPDATE "Notifications" n SET "TriggeredByUserId" = NULL FROM "Users" u WHERE n."TriggeredByUserId" IS NOT NULL AND u."Id" IS NULL AND n."TriggeredByUserId" = n."TriggeredByUserId"';
    -- Recount
    EXECUTE 'SELECT COUNT(*) FROM "Notifications" n LEFT JOIN "Users" u ON n."TriggeredByUserId" = u."Id" WHERE n."TriggeredByUserId" IS NOT NULL AND u."Id" IS NULL' INTO cnt_notifications_triggeredby;
    RAISE NOTICE 'After nullable cleanup, Notifications.TriggeredBy remaining=%', cnt_notifications_triggeredby;
  END IF;

  -- For other non-nullable FK columns we cannot auto-null; collect sample rows for manual remediation.
  IF cnt_notifications_userid > 0 THEN
    RAISE NOTICE 'Notifications.UserId has % orphan rows. Sample rows:', cnt_notifications_userid;
    FOR t IN EXECUTE 'SELECT id::text FROM "Notifications" n LEFT JOIN "Users" u ON n."UserId" = u."Id" WHERE u."Id" IS NULL LIMIT 20' LOOP
      RAISE NOTICE '%', t;
    END LOOP;
  END IF;

  IF cnt_discussions_createdby > 0 THEN
    RAISE NOTICE 'Discussions.CreatedByUserId has % orphan rows. Sample rows:' , cnt_discussions_createdby;
    FOR t IN EXECUTE 'SELECT id::text FROM "Discussions" d LEFT JOIN "Users" u ON d."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL LIMIT 20' LOOP
      RAISE NOTICE '%', t;
    END LOOP;
  END IF;

  IF cnt_posts_createdby > 0 THEN
    RAISE NOTICE 'Posts.CreatedByUserId has % orphan rows. Sample rows:' , cnt_posts_createdby;
    FOR t IN EXECUTE 'SELECT id::text FROM "Posts" p LEFT JOIN "Users" u ON p."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL LIMIT 20' LOOP
      RAISE NOTICE '%', t;
    END LOOP;
  END IF;

  IF cnt_postlikes_userid > 0 THEN
    RAISE NOTICE 'PostLikes.UserId has % orphan rows. Sample rows:' , cnt_postlikes_userid;
    FOR t IN EXECUTE 'SELECT id::text FROM "PostLikes" pl LEFT JOIN "Users" u ON pl."UserId" = u."Id" WHERE u."Id" IS NULL LIMIT 20' LOOP
      RAISE NOTICE '%', t;
    END LOOP;
  END IF;

  IF cnt_postmentions_mentioneduser > 0 THEN
    RAISE NOTICE 'PostMentions.MentionedUserId has % orphan rows. Sample rows:' , cnt_postmentions_mentioneduser;
    FOR t IN EXECUTE 'SELECT id::text FROM "PostMentions" pm LEFT JOIN "Users" u ON pm."MentionedUserId" = u."Id" WHERE u."Id" IS NULL LIMIT 20' LOOP
      RAISE NOTICE '%', t;
    END LOOP;
  END IF;

  -- Recalculate total remaining orphans (excluding the nullable we attempted to fix)
  remaining_orphans := (cnt_notifications_userid + cnt_discussions_createdby + cnt_posts_createdby + cnt_postlikes_userid + cnt_postmentions_mentioneduser + cnt_notifications_triggeredby);

  IF remaining_orphans = 0 THEN
    RAISE NOTICE 'No remaining orphaned user references; validating constraints.';
    FOREACH t IN ARRAY constraint_names LOOP
      BEGIN
        EXECUTE format('ALTER TABLE %%I VALIDATE CONSTRAINT %%I', substring(t from 'FK_([^_]+)_'), t);
      EXCEPTION WHEN others THEN
        -- Fall back: attempt to derive table name from known mapping
        IF t = 'FK_Notifications_Users_UserId' OR t = 'FK_Notifications_Users_TriggeredByUserId' THEN
          EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', 'Notifications', t);
        ELSIF t = 'FK_Discussions_Users_CreatedByUserId' THEN
          EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', 'Discussions', t);
        ELSIF t = 'FK_DiscussionSubscriptions_Users_UserId' THEN
          EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', 'DiscussionSubscriptions', t);
        ELSIF t = 'FK_DiscussionViews_Users_UserId' THEN
          EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', 'DiscussionViews', t);
        ELSIF t = 'FK_Posts_Users_CreatedByUserId' THEN
          EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', 'Posts', t);
        ELSIF t = 'FK_PostLikes_Users_UserId' THEN
          EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', 'PostLikes', t);
        ELSIF t = 'FK_PostMentions_Users_MentionedUserId' THEN
          EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', 'PostMentions', t);
        END IF;
      END;
      RAISE NOTICE 'Validated constraint %', t;
    END LOOP;
  ELSE
    RAISE NOTICE 'Remaining orphan count (% ) > 0; skipping constraint validation. Please resolve orphan rows listed above before running validation.' , remaining_orphans;
  END IF;
END$$;

-- Helpful selects for manual remediation (if needed)
-- Use these to inspect offending rows and decide how to reconcile them.
-- SELECT n.* FROM "Notifications" n LEFT JOIN "Users" u ON n."UserId" = u."Id" WHERE u."Id" IS NULL LIMIT 100;
-- SELECT d.* FROM "Discussions" d LEFT JOIN "Users" u ON d."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL LIMIT 100;
-- SELECT p.* FROM "Posts" p LEFT JOIN "Users" u ON p."CreatedByUserId" = u."Id" WHERE u."Id" IS NULL LIMIT 100;
