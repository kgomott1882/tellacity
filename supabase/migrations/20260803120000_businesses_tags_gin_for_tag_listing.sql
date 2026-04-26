-- Speed up /tags/[slug] filters that use array contains on tags and secondary_category_slugs.
-- Safe to apply after tags / secondary_category_slugs are text[] (or compatible).

create index if not exists businesses_tags_gin_idx
  on public.businesses using gin (tags);

create index if not exists businesses_secondary_category_slugs_gin_idx
  on public.businesses using gin (secondary_category_slugs);
