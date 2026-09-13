-- SEO quality helpers for sitemap shards + counts.
-- Eligible = active AND (claimed via owner_id OR review_count > 0 OR length(trim(description)) > 100).

create or replace function public.business_is_seo_quality(
  p_owner_id uuid,
  p_review_count integer,
  p_description text
)
returns boolean
language sql
immutable
as $$
  select
    p_owner_id is not null
    or coalesce(p_review_count, 0) > 0
    or length(trim(both from coalesce(p_description, ''))) > 100;
$$;

create or replace function public.count_sitemap_eligible_businesses()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::bigint
  from public.businesses b
  where coalesce(b.status, 'active') = 'active'
    and public.business_is_seo_quality(
      b.owner_id,
      b.review_count,
      b.description
    );
$$;

create or replace function public.count_thin_business_profiles()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::bigint
  from public.businesses b
  where coalesce(b.status, 'active') = 'active'
    and not public.business_is_seo_quality(
      b.owner_id,
      b.review_count,
      b.description
    );
$$;

create or replace function public.list_sitemap_eligible_businesses(
  p_offset integer,
  p_limit integer
)
returns table (
  id uuid,
  slug text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.id, b.slug, b.updated_at
  from public.businesses b
  where coalesce(b.status, 'active') = 'active'
    and public.business_is_seo_quality(
      b.owner_id,
      b.review_count,
      b.description
    )
  order by b.id asc
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 1000), 1), 5000);
$$;

revoke all on function public.business_is_seo_quality(uuid, integer, text) from public;
grant execute on function public.business_is_seo_quality(uuid, integer, text) to anon, authenticated, service_role;

revoke all on function public.count_sitemap_eligible_businesses() from public;
grant execute on function public.count_sitemap_eligible_businesses() to anon, authenticated, service_role;

revoke all on function public.count_thin_business_profiles() from public;
grant execute on function public.count_thin_business_profiles() to anon, authenticated, service_role;

revoke all on function public.list_sitemap_eligible_businesses(integer, integer) from public;
grant execute on function public.list_sitemap_eligible_businesses(integer, integer) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
