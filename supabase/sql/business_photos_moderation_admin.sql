-- =========================================================================
-- business_photos — moderation admin SQL
-- =========================================================================
-- Ad-hoc SQL for the Supabase SQL editor (or psql) to approve, reject,
-- flag, or reset moderation on business photos.
--
-- HOW TO USE
-- ----------
-- 1. Every block that takes an ID is wrapped in /* ... */ so you can
--    safely press "Run" on the whole file without accidentally mutating
--    rows. Only the parameter-free read-only queries at the bottom
--    (blocks 8, 9, 10) will actually execute by default.
-- 2. To use a block: remove the surrounding /* and */, replace the
--    placeholder values (<PHOTO_ID>, <BUSINESS_ID>, etc.), then run.
-- 3. UPDATE blocks must be run with a role that bypasses RLS
--    (`postgres` in the Supabase SQL editor, or the service_role key).
--
-- Allowed values for moderation_status:
--   pending | approved | rejected | flagged
-- =========================================================================


-- -------------------------------------------------------------------------
-- 1. REJECT a single photo (collage / picmix detected)
-- -------------------------------------------------------------------------
-- Row stays in the table for audit, but is hidden from the public profile
-- by RLS.
/*
update public.business_photos
   set moderation_status    = 'rejected',
       is_suspected_collage = true,
       collage_score        = 0.94,                    -- 0.00..1.00, or null
       moderation_reason     = 'Collage / picmix detected',
       moderated_at         = now(),
       moderated_by         = null                     -- auth.users.id of admin, or null
 where id = '<PHOTO_ID>'::uuid;
*/


-- -------------------------------------------------------------------------
-- 2. APPROVE a single photo (make it publicly visible)
-- -------------------------------------------------------------------------
-- Only approved + published rows are returned by public queries. Approving
-- a draft does NOT publish it — the owner still has to press Publish in
-- the dashboard.
/*
update public.business_photos
   set moderation_status    = 'approved',
       is_suspected_collage = false,
       collage_score        = null,
       moderation_reason     = null,
       moderated_at         = now(),
       moderated_by         = null                     -- auth.users.id of admin, or null
 where id = '<PHOTO_ID>'::uuid;
*/


-- -------------------------------------------------------------------------
-- 3. FLAG a single photo for manual review
-- -------------------------------------------------------------------------
-- Flagged rows are hidden from the public profile. Use this when the
-- validator is uncertain (mid-range score) and you want a human to look.
/*
update public.business_photos
   set moderation_status    = 'flagged',
       is_suspected_collage = true,
       collage_score        = 0.62,                    -- 0.00..1.00, or null
       moderation_reason     = 'Possible collage — needs human review',
       moderated_at         = now(),
       moderated_by         = null
 where id = '<PHOTO_ID>'::uuid;
*/


-- -------------------------------------------------------------------------
-- 4. RESET a single photo back to pending (re-queue for validation)
-- -------------------------------------------------------------------------
/*
update public.business_photos
   set moderation_status    = 'pending',
       is_suspected_collage = false,
       collage_score        = null,
       moderation_reason     = null,
       moderated_at         = null,
       moderated_by         = null
 where id = '<PHOTO_ID>'::uuid;
*/


-- -------------------------------------------------------------------------
-- 5. BULK APPROVE every still-pending row for ONE business
-- -------------------------------------------------------------------------
/*
update public.business_photos
   set moderation_status = 'approved',
       moderated_at      = now(),
       moderated_by      = null
 where business_id       = '<BUSINESS_ID>'::uuid
   and moderation_status = 'pending';
*/


-- -------------------------------------------------------------------------
-- 6. BULK REJECT a list of photos (e.g. batch from the validator)
-- -------------------------------------------------------------------------
/*
update public.business_photos
   set moderation_status    = 'rejected',
       is_suspected_collage = true,
       moderation_reason     = 'Collage / picmix detected',
       moderated_at         = now(),
       moderated_by         = null
 where id in (
   '<PHOTO_ID_1>'::uuid,
   '<PHOTO_ID_2>'::uuid,
   '<PHOTO_ID_3>'::uuid
 );
*/


-- -------------------------------------------------------------------------
-- 7. Inspect the moderation queue for ONE business
-- -------------------------------------------------------------------------
/*
select id,
       section,
       status           as publish_status,
       moderation_status,
       is_suspected_collage,
       collage_score,
       moderation_reason,
       created_at,
       moderated_at,
       url
  from public.business_photos
 where business_id = '<BUSINESS_ID>'::uuid
 order by
   case moderation_status
     when 'flagged'  then 0
     when 'pending'  then 1
     when 'rejected' then 2
     when 'approved' then 3
     else 4
   end,
   created_at desc;
*/


-- =========================================================================
-- Safe-by-default read-only queries below. These RUN when you press "Run"
-- on the whole file — no placeholders required.
-- =========================================================================


-- -------------------------------------------------------------------------
-- 8. Global admin review queue (everything not yet approved)
-- -------------------------------------------------------------------------
-- Uses the partial index business_photos_moderation_queue_idx.
select bp.id,
       bp.business_id,
       b.name            as business_name,
       bp.section,
       bp.moderation_status,
       bp.is_suspected_collage,
       bp.collage_score,
       bp.moderation_reason,
       bp.created_at,
       bp.url
  from public.business_photos bp
  join public.businesses      b on b.id = bp.business_id
 where bp.moderation_status <> 'approved'
 order by
   case bp.moderation_status
     when 'flagged'  then 0
     when 'pending'  then 1
     when 'rejected' then 2
     else 3
   end,
   bp.created_at desc
 limit 200;


-- -------------------------------------------------------------------------
-- 9. Suspected-collage review queue only
-- -------------------------------------------------------------------------
-- Uses the partial index business_photos_suspected_collage_idx.
select bp.id,
       bp.business_id,
       b.name            as business_name,
       bp.moderation_status,
       bp.collage_score,
       bp.moderation_reason,
       bp.created_at,
       bp.url
  from public.business_photos bp
  join public.businesses      b on b.id = bp.business_id
 where bp.is_suspected_collage = true
 order by bp.created_at desc
 limit 200;


-- -------------------------------------------------------------------------
-- 10. Counts by moderation_status (quick health check)
-- -------------------------------------------------------------------------
select moderation_status,
       count(*) as total
  from public.business_photos
 group by moderation_status
 order by moderation_status;
