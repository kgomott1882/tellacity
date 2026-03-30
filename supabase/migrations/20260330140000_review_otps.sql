-- Allow invite drafts without guest_name (OTP flow stores minimal columns).
do $$
begin
  alter table public.review_drafts alter column guest_name drop not null;
exception
  when undefined_column then null;
  when others then null;
end $$;

-- Invite review OTP rows (separate from consumer_otps / magic_token flows).
create table if not exists public.review_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  draft_id uuid not null references public.review_drafts (id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists review_otps_draft_id_idx on public.review_otps (draft_id);
create index if not exists review_otps_code_idx on public.review_otps (code);
