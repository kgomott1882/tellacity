-- Clear remaining invalid tags (424 rows), then add constraint.
-- Faster than re-normalizing; empty tags always pass the check.

set statement_timeout = '120s';

-- Optional peek at what is still bad:
-- select id, slug, tags
-- from public.businesses
-- where tags is not null
--   and not public.businesses_tags_are_valid(tags)
-- limit 10;

-- Clear invalid tags in batches of 200 — re-run until "UPDATE 0"
with bad as (
  select b.id
  from public.businesses b
  where b.tags is not null
    and not public.businesses_tags_are_valid(b.tags)
  order by b.id
  limit 200
)
update public.businesses b
set tags = array[]::text[]
from bad
where b.id = bad.id;

-- When still_bad = 0, run the constraint:
-- select count(*) as still_bad
-- from public.businesses b
-- where b.tags is not null
--   and not public.businesses_tags_are_valid(b.tags);

alter table public.businesses
  drop constraint if exists businesses_tags_valid_chk;

alter table public.businesses
  add constraint businesses_tags_valid_chk
  check (public.businesses_tags_are_valid(tags));

notify pgrst, 'reload schema';
