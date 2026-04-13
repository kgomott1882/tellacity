-- Precomputed homepage "Best in" payload (country + category → ranked businesses JSON).
-- Rows are written by a separate job or admin process; the app only reads here.

create table if not exists public.home_best_in_cache (
  country_code text not null,
  category_slug text not null,
  businesses jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (country_code, category_slug)
);

comment on table public.home_best_in_cache is
  'Homepage Best-in carousel: businesses array per country_code and category_slug.';

grant select on public.home_best_in_cache to anon, authenticated;

alter table public.home_best_in_cache enable row level security;

drop policy if exists "public_read_home_best_in_cache" on public.home_best_in_cache;
create policy "public_read_home_best_in_cache"
  on public.home_best_in_cache
  for select
  to anon, authenticated
  using (true);
