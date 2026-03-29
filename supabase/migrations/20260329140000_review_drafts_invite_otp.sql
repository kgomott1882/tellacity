-- Invite review flow: store pending content in review_drafts, OTP in consumer_otps, publish via /api/reviews/verify.

create table if not exists public.review_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  title text,
  body text not null,
  invite_id uuid not null references public.review_invites (id) on delete cascade,
  email text not null,
  guest_name text not null,
  user_id uuid references auth.users (id) on delete set null,
  receipt_url text,
  date_of_experience date,
  marketing_opt_in boolean not null default false,
  reference_number text,
  created_at timestamptz not null default now()
);

create index if not exists review_drafts_invite_id_idx on public.review_drafts (invite_id);

alter table public.review_invites
  add column if not exists used_at timestamptz;

-- consumer_otps: support 6-digit OTP rows linked to review_drafts (magic_token flow may use other columns).
create table if not exists public.consumer_otps (
  id uuid primary key default gen_random_uuid(),
  magic_token uuid,
  review_id uuid,
  expires_at timestamptz,
  used_at timestamptz,
  email text,
  code text,
  type text,
  draft_id uuid,
  created_at timestamptz not null default now()
);

alter table public.consumer_otps add column if not exists email text;
alter table public.consumer_otps add column if not exists code text;
alter table public.consumer_otps add column if not exists type text;
alter table public.consumer_otps add column if not exists draft_id uuid;
alter table public.consumer_otps add column if not exists created_at timestamptz default now();

do $$
begin
  alter table public.consumer_otps alter column magic_token drop not null;
exception
  when undefined_column then null;
  when others then null;
end $$;

do $$
begin
  alter table public.consumer_otps alter column review_id drop not null;
exception
  when undefined_column then null;
  when others then null;
end $$;

create index if not exists consumer_otps_draft_type_idx
  on public.consumer_otps (draft_id, type)
  where draft_id is not null;

create index if not exists consumer_otps_email_code_created_idx
  on public.consumer_otps (email, code, created_at desc);
