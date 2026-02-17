-- Career applications (job apply form submissions)
create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  job_slug text not null,
  job_title text not null,
  full_name text not null,
  email text not null,
  phone text,
  linkedin_url text,
  message text,
  resume_filename text,
  cover_filename text,
  resume_url text,
  cover_url text,
  created_at timestamptz not null default now()
);

-- Allow anonymous inserts (form submissions from public site)
alter table public.career_applications enable row level security;

create policy "Allow anonymous insert for career applications"
  on public.career_applications
  for insert
  to anon
  with check (true);

-- Only authenticated users (e.g. admin) can read
create policy "Allow authenticated read"
  on public.career_applications
  for select
  to authenticated
  using (true);

comment on table public.career_applications is 'Job application submissions from /careers/[slug] form';
