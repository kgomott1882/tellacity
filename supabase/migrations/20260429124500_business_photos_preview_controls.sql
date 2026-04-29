-- Per-photo preview framing controls (all plans).
-- Lets owners manually tune how each image is framed in profile previews.

alter table public.business_photos
  add column if not exists preview_zoom double precision not null default 1.0;

alter table public.business_photos
  add column if not exists preview_x double precision not null default 50.0;

alter table public.business_photos
  add column if not exists preview_y double precision not null default 50.0;

alter table public.business_photos
  add column if not exists preview_frame text not null default 'landscape';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_photos_preview_frame_check'
      and conrelid = 'public.business_photos'::regclass
  ) then
    alter table public.business_photos
      add constraint business_photos_preview_frame_check
      check (preview_frame in ('landscape', 'portrait'));
  end if;
end $$;

-- Clamp bad historical values if any rows already exist.
update public.business_photos
set
  preview_zoom = greatest(1.0, least(2.5, coalesce(preview_zoom, 1.0))),
  preview_x = greatest(0.0, least(100.0, coalesce(preview_x, 50.0))),
  preview_y = greatest(0.0, least(100.0, coalesce(preview_y, 50.0))),
  preview_frame = case
    when preview_frame in ('landscape', 'portrait') then preview_frame
    else 'landscape'
  end;
