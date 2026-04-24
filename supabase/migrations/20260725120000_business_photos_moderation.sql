-- =========================================================================
-- business_photos: moderation layer (collage / picmix detection + admin review).
-- Adds the data model, indexes, and RLS updates that make `business_photos`
-- the single source of truth for public visibility once an external image
-- validator has approved an upload.
--
-- Visibility contract (enforced in RLS below):
--   public (anon / authenticated viewing other people's profiles) sees
--   photos iff:
--       status             = 'published'
--   AND moderation_status  = 'approved'
--   AND the owning business is active.
--
--   Owners / co-owners / team members of the business continue to see ALL
--   their own photos (any status, any moderation_status) through the
--   existing `business_photos_dashboard_access` policy — nothing changes
--   there, so they can see "pending", "rejected", and "flagged" rows in
--   the dashboard and act on them.
--
-- Safe to re-run.
-- =========================================================================

-- 1. Columns -------------------------------------------------------------

alter table public.business_photos
  add column if not exists moderation_status text not null default 'pending';

alter table public.business_photos
  add column if not exists rejection_reason text;

alter table public.business_photos
  add column if not exists is_suspected_collage boolean not null default false;

-- Optional confidence score from the external validator (e.g. 0.0 – 1.0).
alter table public.business_photos
  add column if not exists collage_score double precision;

-- Audit trail: when and by whom the photo was last moderated.
alter table public.business_photos
  add column if not exists moderated_at timestamptz;

alter table public.business_photos
  add column if not exists moderated_by uuid references auth.users(id) on delete set null;

-- Enum check on moderation_status (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'business_photos_moderation_status_check'
      and conrelid = 'public.business_photos'::regclass
  ) then
    alter table public.business_photos
      add constraint business_photos_moderation_status_check
      check (moderation_status in ('pending', 'approved', 'rejected', 'flagged'));
  end if;
end $$;

-- Sanity range on collage_score (nullable, but if set it must be 0..1).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'business_photos_collage_score_check'
      and conrelid = 'public.business_photos'::regclass
  ) then
    alter table public.business_photos
      add constraint business_photos_collage_score_check
      check (collage_score is null or (collage_score >= 0 and collage_score <= 1));
  end if;
end $$;

-- 2. Backfill ------------------------------------------------------------
--
-- Existing photos that were already live BEFORE this migration landed are
-- auto-approved so we don't cause a visible blackout while the external
-- validator catches up. New uploads default to 'pending' going forward.
update public.business_photos
  set moderation_status = 'approved',
      moderated_at      = coalesce(moderated_at, now())
  where status = 'published'
    and moderation_status = 'pending';

-- Drafts stay 'pending' by default — they aren't visible publicly anyway
-- and may get updated by the validator asynchronously.

-- 3. Indexes -------------------------------------------------------------

-- Fast public reads: every public SELECT on business_photos has to find
-- (business_id, status='published', moderation_status='approved') quickly.
create index if not exists business_photos_public_visible_idx
  on public.business_photos (business_id, status, moderation_status);

-- Admin / validator queues: find all non-approved rows cheaply (partial).
create index if not exists business_photos_moderation_queue_idx
  on public.business_photos (business_id, moderation_status, created_at desc)
  where moderation_status <> 'approved';

-- Collage review queue: only flagged/rejected collage-style rows are indexed.
create index if not exists business_photos_suspected_collage_idx
  on public.business_photos (business_id, created_at desc)
  where is_suspected_collage = true;

-- 4. RLS — public read enforces approved -------------------------------

drop policy if exists "business_photos_public_select" on public.business_photos;
create policy "business_photos_public_select"
  on public.business_photos for select
  to anon, authenticated
  using (
    status = 'published'
    and moderation_status = 'approved'
    and exists (
      select 1 from public.businesses b
      where b.id = business_photos.business_id
        and b.status = 'active'
    )
  );

-- The dashboard policy `business_photos_dashboard_access` (from an earlier
-- migration) is intentionally left untouched: owners must still see their
-- own pending / rejected / flagged photos in the dashboard so they can
-- respond to rejection reasons.

-- 5. View used for the Free-plan 30-day publish lock --------------------
--
-- The lock is anchored on when the OWNER pressed publish — independent of
-- when moderation finishes — so we do NOT restrict the view to approved.
-- Rejected rows still count toward the window (we don't want the cooldown
-- to be retroactively shortened just because the validator took a day).
-- (View is the same as before; recreated here for idempotency.)
create or replace view public.business_photo_publish_latest as
  select business_id, max(published_at) as last_published_at
  from public.business_photos
  where status = 'published'
    and published_at is not null
  group by business_id;

grant select on public.business_photo_publish_latest to anon, authenticated;

-- 6. Grants (unchanged, repeated for idempotency) -----------------------

grant select on table public.business_photos to anon;
grant select, insert, update, delete on table public.business_photos to authenticated;
