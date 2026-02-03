-- Ensure secondary_category_slugs exists on businesses (for Categories: 1 primary + up to 5 secondary)
alter table public.businesses
  add column if not exists secondary_category_slugs text[] default '{}';

comment on column public.businesses.secondary_category_slugs is 'Up to 5 secondary category slugs; primary is category_slug';
