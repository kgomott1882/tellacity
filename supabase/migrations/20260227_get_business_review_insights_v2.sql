-- 1️⃣ Drop old version safely
drop function if exists public.get_business_review_insights(uuid);

-- 2️⃣ Create clean version
create or replace function public.get_business_review_insights(
  p_business_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin

  with rev_all as (
    select *
    from reviews
    where business_id = p_business_id
      and status in ('published','approved')
  ),

  -- Review aggregates
  rev_stats as (
    select
      count(*) as total_reviews,
      coalesce(avg(rating),0) as avg_rating,
      count(*) filter (where created_at >= now() - interval '90 days') as reviews_90d
    from rev_all
  ),

  -- Rating distribution (separate aggregate layer)
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

  -- Sentiment buckets (no nested aggregates)
  sentiment_stats as (
    select
      count(*) filter (where rating >= 4) as positive,
      count(*) filter (where rating = 3) as neutral,
      count(*) filter (where rating <= 2) as negative
    from rev_all
  ),

  -- Invite aggregates
  inv_all as (
    select *
    from review_invites
    where business_id = p_business_id
  ),

  inv_stats as (
    select
      count(*) as total_invites,
      count(*) filter (where created_at >= now() - interval '30 days') as invites_last_30,
      count(*) filter (where created_at >= now() - interval '90 days') as invites_90d
    from inv_all
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

      case
        when rs.total_reviews = 0 then 0
        else round((rs.reviews_90d::numeric / rs.total_reviews) * 100,2)
      end as review_velocity_percent,

      case
        when ij.total_invites = 0 then 0
        else round((rs.total_reviews::numeric / ij.total_invites) * 100,2)
      end as invite_conversion_percent,

      round((rs.avg_rating / 5.0) * 100,1) as trust_score

    from rev_stats rs
    cross join inv_stats ij
    cross join rating_json rj
    cross join sentiment_stats ss
  )

  select jsonb_build_object(
    'total_reviews', total_reviews,
    'avg_rating', avg_rating,
    'rating_distribution', rating_distribution,
    'sentiment', jsonb_build_object(
        'positive', positive,
        'neutral', neutral,
        'negative', negative
    ),
    'reviews_90d', reviews_90d,
    'review_velocity_percent', review_velocity_percent,
    'total_invites', total_invites,
    'invites_last_30', invites_last_30,
    'invites_90d', invites_90d,
    'invite_conversion_percent', invite_conversion_percent,
    'trust_score', trust_score,
    'reputation_status',
      case
        when trust_score >= 80 then 'Strong'
        when trust_score >= 60 then 'Growing'
        else 'Needs Attention'
      end
  )
  into result
  from computed;

  return result;

end;
$$;

grant execute on function public.get_business_review_insights(uuid) to authenticated;
