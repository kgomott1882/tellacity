-- Run this in Supabase Dashboard → SQL Editor if you see:
--   "Could not find the table 'public.business_suggestion_verifications' in the schema cache"
-- Idempotent: safe to run more than once.
--
-- If you already created a partial/wrong table (missing payload, suggester_email, etc.), run
--   scripts/fix-business-suggestion-verifications.sql
-- instead (it aligns columns without dropping data when possible).

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

grant all on table public.business_suggestion_verifications to service_role;

notify pgrst, 'reload schema';
