-- Support invite OTP verify insert: verification_status + imported (NOT NULL-safe defaults).
alter table public.reviews add column if not exists verification_status text;
alter table public.reviews add column if not exists imported boolean not null default false;

comment on column public.reviews.verification_status is
  'Publication verification: e.g. verified after OTP; optional if verified_at is used.';
comment on column public.reviews.imported is 'True when review was imported from an external source.';
