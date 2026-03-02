-- Widget payload RPC: returns business info + live stats + recent reviews for embed widgets.
-- Uses LATERAL aggregate (same pattern as get_business_by_slug) — no view dependency.

drop function if exists public.get_widget_payload_v1(text, int);

create or replace function public.get_widget_payload_v1(
  p_business_slug text,
  p_limit int default 5
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when b.id is null then jsonb_build_object('error', 'Business not found')
      else jsonb_build_object(
        'business_name',  b.name,
        'slug',           b.slug,
        'logo_url',       b.logo_url,
        'avg_rating',     round(coalesce(stats.avg_rating, 0)::numeric, 2),
        'review_count',   coalesce(stats.review_count, 0),
        'reviews', (
          select coalesce(jsonb_agg(
            jsonb_build_object(
              'id',            r.id,
              'rating',        r.rating,
              'title',         r.title,
              'body',          r.body,
              'reviewer_name', r.guest_name,
              'created_at',    r.created_at
            )
            order by r.created_at desc
          ), '[]'::jsonb)
          from public.reviews r
          where r.business_id = b.id
            and r.status = 'published'
          limit greatest(1, least(20, p_limit))
        )
      )
    end
  from public.businesses b
  left join lateral (
    select
      avg(r.rating)::float   as avg_rating,
      count(*)::bigint        as review_count
    from public.reviews r
    where r.business_id = b.id
      and r.status = 'published'
  ) stats on true
  where b.slug = p_business_slug
    and coalesce(b.status, 'active') = 'active'
  limit 1;
$$;

comment on function public.get_widget_payload_v1(text, int) is
  'Returns widget payload (business info, live stats, recent published reviews) for embed widgets.';

grant execute on function public.get_widget_payload_v1(text, int) to anon;
grant execute on function public.get_widget_payload_v1(text, int) to authenticated;
