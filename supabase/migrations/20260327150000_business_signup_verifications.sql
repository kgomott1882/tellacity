-- Pending OTP + form payload for business email signup (service role only; no RLS policies).

create table if not exists public.business_signup_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists business_signup_verifications_email_idx
  on public.business_signup_verifications (lower(email));

alter table public.business_signup_verifications enable row level security;
