create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  purpose text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

create index if not exists email_otps_email_idx on public.email_otps (email);
create index if not exists email_otps_code_idx on public.email_otps (code);
create index if not exists email_otps_purpose_idx on public.email_otps (purpose);
