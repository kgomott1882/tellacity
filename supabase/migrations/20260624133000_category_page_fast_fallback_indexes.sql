-- Speed up category directory fallback query used by `/categories/[category_slug]`.
-- Query shape:
--   where status = 'active'
--     and category_slug in (...)
--     and country_code in (...)
--   order by trust_score desc, review_count desc, name asc

create index if not exists idx_businesses_active_cat_country_rank
  on public.businesses (category_slug, country_code, trust_score desc, review_count desc, name asc)
  where coalesce(status, 'active') = 'active';

