-- Unified latest published articles for homepage (platform editorial + verified business).

create or replace function public.get_latest_hub_articles(p_limit integer default 4)
returns table (
  id text,
  slug text,
  title text,
  excerpt text,
  featured_image_url text,
  published_at timestamptz,
  content_type text,
  category text,
  publisher_name text,
  publisher_href text
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from (
    select
      ('platform:' || pa.id::text) as id,
      pa.slug,
      pa.title,
      coalesce(pa.excerpt, '') as excerpt,
      pa.featured_image_url,
      coalesce(pa.published_at, pa.updated_at, pa.created_at) as published_at,
      'tellacity'::text as content_type,
      pa.topic as category,
      'Tellacity'::text as publisher_name,
      '/about'::text as publisher_href
    from public.platform_articles pa
    where pa.status = 'published'

    union all

    select
      a.id::text as id,
      a.slug,
      a.title,
      coalesce(a.excerpt, '') as excerpt,
      a.featured_image_url,
      coalesce(a.published_at, a.created_at) as published_at,
      case
        when a.content_type = 'case_study' then 'case_study'
        else 'business'
      end as content_type,
      b.category_slug as category,
      b.name as publisher_name,
      case
        when nullif(trim(b.slug), '') is not null
          then '/b/' || nullif(trim(b.slug), '')
        else null
      end as publisher_href
    from public.articles a
    inner join public.businesses b on b.id = a.business_id
    where a.status = 'published'
      and coalesce(b.status, 'active') = 'active'
  ) combined
  order by combined.published_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 4), 100));
$$;

comment on function public.get_latest_hub_articles(integer) is
  'Newest published platform + business articles for homepage and discovery widgets.';

grant execute on function public.get_latest_hub_articles(integer) to anon, authenticated, service_role;
