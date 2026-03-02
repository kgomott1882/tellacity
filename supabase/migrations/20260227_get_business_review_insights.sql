-- get_business_review_insights: single-business analytics RPC for the Performance dashboard.
-- Returns all metrics needed by the frontend in one round-trip.
-- Requires: public.reviews, public.review_invites, public.businesses

drop function if exists public.get_business_review_insights(uuid);

create or replace function public.get_business_review_insights(business_id uuid)
returns table (
  total_reviews           bigint,
  avg_rating              float,
  rating_distribution     jsonb,
  sentiment               jsonb,
  reviews_90d             bigint,
  review_velocity_percent float,
  total_invites           bigint,
  invites_last_30         bigint,
  invites_90d             bigint,
  invite_conversion_percent float,
  trust_score             float,
  reputation_status       text
)
language sql
stable
security definer
set search_path = public
as $$
  with
  rev_all as (
    select
      r.rating,
      r.created_at
    from public.reviews r
    where r.business_id = get_business_review_insights.business_id
      and r.status in ('published', 'approved')
  ),
  rev_stats as (
    select
      count(*)::bigint                                                         as total_reviews,
      coalesce(avg(rating)::float, 0)                                         as avg_rating,
      count(*) filter (where created_at >= now() - interval '90 days')::bigint as reviews_90d,
      -- rating distribution as JSON object {"1":n,"2":n,...,"5":n}
      jsonb_build_object(
        '1', count(*) filter (where round(rating) = 1),
        '2', count(*) filter (where round(rating) = 2),
        '3', count(*) filter (where round(rating) = 3),
        '4', count(*) filter (where round(rating) = 4),
        '5', count(*) filter (where round(rating) = 5)
      )                                                                        as rating_distribution,
      -- sentiment buckets
      count(*) filter (where rating >= 4)::bigint                             as positive,
      count(*) filter (where round(rating) = 3)::bigint                      as neutral,
      count(*) filter (where rating < 3)::bigint                              as negative
    from rev_all
  ),
  inv_stats as (
    select
      count(*)::bigint                                                                  as total_invites,
      count(*) filter (where created_at >= now() - interval '30 days')::bigint         as invites_last_30,
      count(*) filter (where created_at >= now() - interval '90 days')::bigint         as invites_90d
    from public.review_invites
    where review_invites.business_id = get_business_review_insights.business_id
  ),
  computed as (
    select
      rs.total_reviews,
      rs.avg_rating,
      rs.rating_distribution,
      jsonb_build_object(
        'positive', rs.positive,
        'neutral',  rs.neutral,
        'negative', rs.negative
      )                                                                        as sentiment,
      rs.reviews_90d,
      -- velocity: reviews in last 90d as % of total (capped 0-100)
      case when rs.total_reviews > 0
        then least(round((rs.reviews_90d::float / rs.total_reviews * 100)::numeric, 1)::float, 100)
        else 0
      end                                                                      as review_velocity_percent,
      inv.total_invites,
      inv.invites_last_30,
      inv.invites_90d,
      -- conversion: reviews / invites * 100 (capped 0-100)
      case when inv.total_invites > 0
        then least(round((rs.total_reviews::float / inv.total_invites * 100)::numeric, 1)::float, 100)
        else 0
      end                                                                      as invite_conversion_percent,
      -- trust score: avg_rating scaled 0-100
      round((rs.avg_rating / 5.0 * 100)::numeric, 0)::float                  as trust_score
    from rev_stats rs
    cross join inv_stats inv
  )
  select
    c.total_reviews,
    c.avg_rating,
    c.rating_distribution,
    c.sentiment,
    c.reviews_90d,
    c.review_velocity_percent,
    c.total_invites,
    c.invites_last_30,
    c.invites_90d,
    c.invite_conversion_percent,
    c.trust_score,
    -- reputation_status derived from avg_rating + velocity
    case
      when c.avg_rating >= 4.2 and c.review_velocity_percent >= 20 then 'Strong Reputation'
      when c.avg_rating < 3.5                                        then 'Needs Attention'
      else                                                                'Growing'
    end                                                                        as reputation_status
  from computed c;
$$;

comment on function public.get_business_review_insights(uuid) is
  'Returns all analytics metrics for the Performance dashboard in a single RPC call.';

grant execute on function public.get_business_review_insights(uuid) to authenticated;
