-- Contact form submissions (Get in Touch / investor relations → sales@tellacity.com)
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  source text default 'investor_relations',
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

create policy "Allow anonymous insert for contact submissions"
  on public.contact_submissions
  for insert
  to anon
  with check (true);

create policy "Allow authenticated read"
  on public.contact_submissions
  for select
  to authenticated
  using (true);

comment on table public.contact_submissions is 'Get in Touch form submissions (investor relations, etc.) sent to sales@tellacity.com';
