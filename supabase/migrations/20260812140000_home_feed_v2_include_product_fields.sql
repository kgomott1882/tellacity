-- Landing recent-reviews cards need product metadata for product-review label rendering.
-- Keep existing ranking behavior (one latest visible published review per business),
-- while exposing product_photo_id/product_name when the latest review is product-scoped.

create or replace view public.home_feed_v2 as
with ranked as (
  select
    r.id as review_id,
    r.business_id,
    r.rating,
    r.title,
    r.body,
    r.created_at,
    r.guest_name,
    r.visibility,
    r.is_flagged,
    b.name as business_name,
    b.website,
    b.slug as business_slug,
    b.country_code,
    b.logo_url,
    r.product_photo_id,
    bp.product_name,
    row_number() over (
      partition by lower(trim(b.name))
      order by r.created_at desc
    ) as rn
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  left join public.business_photos bp on bp.id = r.product_photo_id
  where coalesce(r.visibility, 'visible') = 'visible'
    and r.status = 'published'
    and coalesce(b.status, 'active') = 'active'
    and b.website is not null
    and b.website <> ''
)
select
  review_id,
  business_id,
  rating,
  title,
  body,
  created_at,
  guest_name,
  visibility,
  is_flagged,
  business_name,
  website,
  business_slug,
  country_code,
  logo_url,
  rn,
  product_photo_id,
  product_name
from ranked
where rn = 1
order by created_at desc;

grant select on public.home_feed_v2 to anon, authenticated;
