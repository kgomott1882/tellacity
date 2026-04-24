-- 2026-07-27
-- Relax the legacy CHECK on public.business_photos.section so that custom
-- photo categories — created by business owners via the dashboard
-- (public.business_photo_sections) — can actually receive photos.
--
-- Symptom in the dashboard before this migration:
--   new row for relation "business_photos" violates check constraint
--   "business_photos_section_check"
-- …triggered whenever a user uploaded to a custom section whose slug
-- wasn't in the original built-in list (gallery/products/services/team/
-- workspace/fleet-logistics).
--
-- Per-business section slugs are now authoritative in
-- public.business_photo_sections (unique per business + slug, RLS-scoped).
-- The upload API route validates the slug against that table before
-- inserting into business_photos, so a hard-coded DB enum is redundant
-- and actively blocks custom categories.
--
-- We still keep a lightweight format check so garbage slugs can't sneak
-- in (lowercase alphanumerics with single hyphens). It's added NOT VALID
-- so stale legacy rows — if any exist — don't block the migration; new
-- inserts and updates must conform.

-- 1) Drop the legacy enum-style check, if present.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'business_photos_section_check'
      and conrelid = 'public.business_photos'::regclass
  ) then
    alter table public.business_photos
      drop constraint business_photos_section_check;
  end if;
end$$;

-- 2) Add a permissive format check so custom slugs still have to be
--    well-formed (matches the client-side slugify(): lowercase ascii
--    letters/digits separated by single hyphens, no leading/trailing
--    hyphen, non-empty). Idempotent + NOT VALID for safety.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_photos_section_slug_format_check'
      and conrelid = 'public.business_photos'::regclass
  ) then
    alter table public.business_photos
      add constraint business_photos_section_slug_format_check
      check (section ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
      not valid;
  end if;
end$$;

-- Optional: once you've confirmed all existing rows match the pattern
-- (they should — section defaults to 'gallery' and the app slugifies
-- before insert), you can promote the constraint with:
--
--   alter table public.business_photos
--     validate constraint business_photos_section_slug_format_check;
