-- get_business_review_insights: read aggregates by business_id only (no auth.uid() in WHERE).
-- RLS on reviews/review_invites can return zero rows when JWT is not ready yet on refresh;
-- this SECURITY DEFINER function sets row_security=off so inner selects are not filtered by
-- the caller's RLS session. Callers must only pass business IDs the dashboard has already
-- scoped to the signed-in user.
--
-- Return JSON shape unchanged (avg_rating, total_reviews, trust_score, rating_distribution, sentiment, trend, etc.).

drop function if exists public.get_business_review_insights(uuid);

create or replace function public.get_business_review_insights(
  p_business_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path to public
set row_security to off
as $$
declare
  result jsonb;
begin

  with rev_all as (
    select *
    from public.reviews
    where business_id = p_business_id
      and status in ('published','approved')
  ),

  rev_stats as (
    select
      count(*) as total_reviews,
      coalesce(avg(rating),0) as avg_rating,
      count(*) filter (where created_at >= now() - interval '90 days') as reviews_90d
    from rev_all
  ),

  rating_dist as (
    select rating, count(*) as cnt
    from rev_all
    group by rating
  ),

  rating_json as (
    select coalesce(
      jsonb_object_agg(rating::text, cnt),
      '{}'::jsonb
    ) as rating_distribution
    from rating_dist
  ),

  sentiment_stats as (
    select
      count(*) filter (where rating >= 4) as positive,
      count(*) filter (where rating = 3)  as neutral,
      count(*) filter (where rating <= 2) as negative
    from rev_all
  ),

  inv_all as (
    select *
    from public.review_invites
    where business_id = p_business_id
  ),

  inv_stats as (
    select
      count(*) as total_invites,
      count(*) filter (where created_at >= now() - interval '30 days') as invites_last_30,
      count(*) filter (where created_at >= now() - interval '90 days') as invites_90d
    from inv_all
  ),

  reviews_last_30 as (
    select count(*) as cnt
    from rev_all
    where created_at >= now() - interval '30 days'
  ),

  reviews_prev_30 as (
    select count(*) as cnt
    from rev_all
    where created_at >= now() - interval '60 days'
      and created_at <  now() - interval '30 days'
  ),

  computed as (
    select
      rs.total_reviews,
      rs.avg_rating,
      rs.reviews_90d,
      ij.total_invites,
      ij.invites_last_30,
      ij.invites_90d,
      rj.rating_distribution,
      ss.positive,
      ss.neutral,
      ss.negative,
      r30.cnt  as last_30,
      p30.cnt  as prev_30,

      case
        when rs.total_reviews = 0 then 0
        else round((rs.reviews_90d::numeric / rs.total_reviews) * 100, 2)
      end as review_velocity_percent,

      case
        when ij.total_invites = 0 then 0
        else round((rs.total_reviews::numeric / ij.total_invites) * 100, 2)
      end as invite_conversion_percent,

      round((rs.avg_rating / 5.0) * 100, 1) as trust_score,

      case
        when p30.cnt = 0 and r30.cnt = 0 then 0::numeric
        when p30.cnt = 0                  then 100::numeric
        else round(((r30.cnt - p30.cnt)::numeric / p30.cnt) * 100, 1)
      end as trend_percent_change,

      case
        when r30.cnt > p30.cnt then 'up'
        when r30.cnt < p30.cnt then 'down'
        else                        'flat'
      end as trend_direction

    from rev_stats rs
    cross join inv_stats ij
    cross join rating_json rj
    cross join sentiment_stats ss
    cross join reviews_last_30 r30
    cross join reviews_prev_30 p30
  )

  select jsonb_build_object(
    'total_reviews',             total_reviews,
    'avg_rating',                avg_rating,
    'rating_distribution',       rating_distribution,
    'sentiment', jsonb_build_object(
        'positive', positive,
        'neutral',  neutral,
        'negative', negative
    ),
    'reviews_90d',               reviews_90d,
    'review_velocity_percent',   review_velocity_percent,
    'total_invites',             total_invites,
    'invites_last_30',           invites_last_30,
    'invites_90d',               invites_90d,
    'invite_conversion_percent', invite_conversion_percent,
    'trust_score',               trust_score,
    'reputation_status',
      case
        when trust_score >= 80 then 'Strong'
        when trust_score >= 60 then 'Growing'
        else 'Needs Attention'
      end,
    'trend', jsonb_build_object(
      'last_30',        last_30,
      'prev_30',        prev_30,
      'percent_change', trend_percent_change,
      'direction',      trend_direction
    )
  )
  into result
  from computed;

  return result;

end;
$$;

grant execute on function public.get_business_review_insights(uuid) to authenticated;
