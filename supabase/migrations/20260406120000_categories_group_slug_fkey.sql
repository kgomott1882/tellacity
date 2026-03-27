-- Fix PostgREST nested select: category_groups → categories
-- FK must be categories.group_slug → category_groups.slug (not legacy "group" column).

alter table public.categories
  drop constraint if exists categories_group_fkey;

-- Idempotent re-run
alter table public.categories
  drop constraint if exists categories_group_slug_fkey;

alter table public.categories
  add constraint categories_group_slug_fkey
  foreign key (group_slug)
  references public.category_groups (slug)
  on delete cascade;

comment on constraint categories_group_slug_fkey on public.categories is
  'Nested embed category_groups.categories uses group_slug → category_groups.slug';
