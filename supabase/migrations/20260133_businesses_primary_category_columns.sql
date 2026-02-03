-- Store primary category group and category id on businesses so dashboard and public page use the same source.
-- categories: id, name, slug, group (group = category_groups.slug)
-- category_groups: id, name, slug

alter table public.businesses add column if not exists primary_group_slug text;
alter table public.businesses add column if not exists primary_category_id uuid;

comment on column public.businesses.primary_group_slug is 'Category group slug for the primary category (from categories.group / category_groups.slug)';
comment on column public.businesses.primary_category_id is 'Category id for the primary category (from categories.id)';
