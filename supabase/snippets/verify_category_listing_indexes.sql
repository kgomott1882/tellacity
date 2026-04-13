-- Optional: confirm category / homepage listing helper indexes exist.
-- Primary migration: 20260624133000_category_page_fast_fallback_indexes.sql

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'businesses'
  and indexname in (
    'idx_businesses_active_cat_country_rank',
    'idx_businesses_active_country_code'
  )
order by indexname;
