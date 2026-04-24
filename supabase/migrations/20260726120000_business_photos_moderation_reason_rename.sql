-- =========================================================================
-- business_photos: rename `rejection_reason` -> `moderation_reason` so the
-- admin moderation UI and email pipeline share one canonical field name.
--
-- The column stores the reason for ANY non-approved moderation outcome
-- (e.g. "Collage / picmix", "Low quality", "Promotional content",
-- "Guideline violation"), not just rejections, so `moderation_reason`
-- describes the data more accurately.
--
-- Safe to re-run.
-- =========================================================================

do $$
begin
  -- Rename path: old column exists, new one does not.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'business_photos'
      and column_name  = 'rejection_reason'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'business_photos'
      and column_name  = 'moderation_reason'
  ) then
    alter table public.business_photos
      rename column rejection_reason to moderation_reason;
  end if;
end $$;

-- Create the column if this is a fresh environment that never had the old name.
alter table public.business_photos
  add column if not exists moderation_reason text;
