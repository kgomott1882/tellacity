-- One-time 6-digit codes after password step on /auth/accept-invite (before accept_business_member_invite RPC).
create table if not exists public.team_invite_otps (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.business_member_invites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists team_invite_otps_invite_user_idx
  on public.team_invite_otps (invite_id, user_id);

create index if not exists team_invite_otps_active_idx
  on public.team_invite_otps (invite_id, user_id, code)
  where used_at is null;

comment on table public.team_invite_otps is 'Email OTP before completing team invite acceptance; written/read via service role from API routes only.';

alter table public.team_invite_otps enable row level security;

revoke all on table public.team_invite_otps from public;
grant select, insert, update, delete on table public.team_invite_otps to service_role;
