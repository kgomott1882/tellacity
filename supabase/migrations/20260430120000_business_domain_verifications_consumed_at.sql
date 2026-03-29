-- Fix PGRST204 on consumed_at: older DBs may have business_domain_verifications without this column
-- (CREATE TABLE IF NOT EXISTS in 20260428120000 does not alter existing tables).

create table if not exists public.business_domain_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.business_domain_verifications
  add column if not exists consumed_at timestamptz null;

comment on column public.business_domain_verifications.consumed_at is
  'When the OTP was used successfully; null means pending.';

alter table public.business_domain_verifications enable row level security;

drop index if exists business_domain_verifications_pending_idx;
create index if not exists business_domain_verifications_pending_idx
  on public.business_domain_verifications (user_id, business_id)
  where consumed_at is null;

notify pgrst, 'reload schema';
