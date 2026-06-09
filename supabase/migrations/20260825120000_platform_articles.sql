-- Tellacity editorial articles (admin-authored, separate from business `articles`).

create table if not exists public.platform_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  body_html text not null default '',
  topic text not null default 'Platform Updates',
  featured_image_url text,
  meta_title text,
  meta_description text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  author_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_articles_slug_key unique (slug)
);

create index if not exists platform_articles_status_published_at_idx
  on public.platform_articles (status, published_at desc nulls last);

create index if not exists platform_articles_updated_at_idx
  on public.platform_articles (updated_at desc);

comment on table public.platform_articles is
  'Tellacity admin-authored editorial articles (blogs). Separate from business-submitted articles.';

create or replace function public.platform_articles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists platform_articles_set_updated_at on public.platform_articles;
create trigger platform_articles_set_updated_at
  before update on public.platform_articles
  for each row execute function public.platform_articles_set_updated_at();

alter table public.platform_articles enable row level security;

drop policy if exists platform_articles_public_read on public.platform_articles;
create policy platform_articles_public_read
  on public.platform_articles
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists platform_articles_admin_all on public.platform_articles;
create policy platform_articles_admin_all
  on public.platform_articles
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
