-- =========================================================================
-- business_photos: publish-first visibility + admin moderation hold.
--
-- Flow change shipped in this migration:
--
--   BEFORE  (hard moderation gate)
--     Upload → status='draft'
--     Publish → status='published', moderation_status='pending'
--     Public sees nothing until moderation_status='approved'.
--
--   AFTER   (publish-first, admin can pull down)
--     Upload → status='draft'
--     Publish → status='published', moderation_status='pending', is_live=true
--     Public sees the photo IMMEDIATELY.
--     Admin approve  → moderation_status='approved', is_live=true   (stays live)
--     Admin reject   → moderation_status='rejected', is_live=false  (pulled down,
--                      owner emailed with the moderation reason)
--     Admin flag     → moderation_status='flagged',  is_live=false  (held down
--                      until a final decision)
--     Admin reset    → moderation_status='pending',  is_live=true   (back to
--                      publish-first pending)
--
-- The new `is_live` boolean is the single switch that decides public
-- visibility, so admins can pull down a live photo without having to delete
-- it. `moderation_status` keeps tracking the review state for the queue
-- badge on the admin sidebar.
--
-- Safe to re-run.
-- =========================================================================

-- 1. Column --------------------------------------------------------------

alter table public.business_photos
  add column if not exists is_live boolean not null default true;

-- 2. Backfill ------------------------------------------------------------
--
-- Keep currently-rejected and currently-flagged rows hidden from the public
-- page. Everything else (approved + pending + drafts) gets `is_live = true`
-- via the column default, which is what we want under publish-first rules.
update public.business_photos
  set is_live = false
  where moderation_status in ('rejected', 'flagged')
    and is_live is distinct from false;

-- 3. Indexes -------------------------------------------------------------
--
-- Replace the old `(business_id, status, moderation_status)` public-read
-- index with one keyed on the new visibility column. The old one is left
-- in place (harmless, still used for moderation_queue sorts) — we just
-- add a tighter index for the new hot path.
create index if not exists business_photos_public_live_idx
  on public.business_photos (business_id, status, is_live);

-- Admin Photo Uploads queue: every pending row, newest first. Partial so
-- the index stays small even as the corpus grows.
create index if not exists business_photos_pending_queue_idx
  on public.business_photos (created_at desc, business_id)
  where moderation_status = 'pending';

-- 4. RLS — public read uses is_live ------------------------------------

drop policy if exists "business_photos_public_select" on public.business_photos;

create policy "business_photos_public_select"
  on public.business_photos for select
  to anon, authenticated
  using (
    status = 'published'
    and is_live = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_photos.business_id
        and b.status = 'active'
    )
  );

-- The dashboard policy `business_photos_dashboard_access` is unchanged:
-- owners / co-owners / team members still see every row they own
-- regardless of `is_live`, so rejected photos still show up in the
-- dashboard with a "Rejected" pill and the moderation reason.

-- 5. Grants (repeated for idempotency) ----------------------------------

grant select on table public.business_photos to anon;
grant select, insert, update, delete on table public.business_photos to authenticated;
