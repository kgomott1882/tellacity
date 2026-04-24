-- Optional grouping for multi-upload / batch-save flows (dashboard photos).

alter table public.business_photos
  add column if not exists upload_batch_id uuid;

alter table public.business_photos
  add column if not exists upload_batch_label text;

create index if not exists business_photos_upload_batch_idx
  on public.business_photos (business_id, upload_batch_id)
  where upload_batch_id is not null;

comment on column public.business_photos.upload_batch_id is
  'Shared id for photos uploaded together before batch label is saved.';

comment on column public.business_photos.upload_batch_label is
  'Human-readable batch name (e.g. "Gallery batch") set when the owner saves a batch.';
