-- Pending public "Suggest a business" submissions until email OTP is verified.

create table if not exists public.business_suggestion_verifications (
  id uuid primary key default gen_random_uuid(),
  suggester_email text not null,
  suggester_name text not null,
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists business_suggestion_verifications_pending_email_idx
  on public.business_suggestion_verifications (suggester_email)
  where consumed_at is null;

comment on table public.business_suggestion_verifications is
  'Holds suggest-business payload + OTP; row consumed after successful insert into businesses.';

alter table public.business_suggestion_verifications enable row level security;

-- Server routes use service_role; no anon/authenticated policies (table is not exposed to clients).
grant all on table public.business_suggestion_verifications to service_role;

notify pgrst, 'reload schema';
