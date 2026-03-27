-- Public taxonomy: Explore Categories, suggest-business, embeds, and RPCs need to read
-- category_groups + categories with the anon key. Without SELECT grants + RLS policies,
-- PostgREST returns 42501 "permission denied for table category_groups".

grant select on public.category_groups to anon, authenticated;
grant select on public.categories to anon, authenticated;

alter table public.category_groups enable row level security;
alter table public.categories enable row level security;

drop policy if exists "public_read_category_groups" on public.category_groups;
create policy "public_read_category_groups"
  on public.category_groups
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_categories" on public.categories;
create policy "public_read_categories"
  on public.categories
  for select
  to anon, authenticated
  using (true);
