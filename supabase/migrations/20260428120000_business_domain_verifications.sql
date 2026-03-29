-- Post-login domain OTP before granting business_owners (draft create + claim flows).

create table if not exists public.business_domain_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists business_domain_verifications_pending_idx
  on public.business_domain_verifications (user_id, business_id)
  where consumed_at is null;

alter table public.business_domain_verifications enable row level security;

comment on table public.business_domain_verifications is
  'OTP codes to prove domain control before inserting business_owners; written via service role from API routes.';
