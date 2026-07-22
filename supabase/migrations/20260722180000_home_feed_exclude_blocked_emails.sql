-- Home feed: never show reviews from permanently blocked emails / guest names.
-- Also re-asserts email purge matching (title/body + columns).

create or replace function public.purge_content_for_email_service(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := public.normalize_block_email(p_email);
  v_reviews int := 0;
  v_drafts int := 0;
  v_otps int := 0;
  v_helpful int := 0;
begin
  if v_email is null or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  delete from public.reviews r
  where lower(trim(coalesce(r.guest_email, ''))) = v_email
     or lower(trim(coalesce(r.author_email, ''))) = v_email
     or lower(trim(coalesce(r.email, ''))) = v_email
     or lower(coalesce(r.title, '')) like '%' || v_email || '%'
     or lower(coalesce(r.body, '')) like '%' || v_email || '%';
  get diagnostics v_reviews = row_count;

  begin
    delete from public.review_drafts d
    where lower(trim(coalesce(d.email, ''))) = v_email
       or lower(coalesce(d.title, '')) like '%' || v_email || '%'
       or lower(coalesce(d.body, '')) like '%' || v_email || '%';
    get diagnostics v_drafts = row_count;
  exception
    when undefined_table then
      v_drafts := 0;
  end;

  begin
    delete from public.review_otps o
    where lower(trim(coalesce(o.email, ''))) = v_email;
    get diagnostics v_otps = row_count;
  exception
    when undefined_table then
      v_otps := 0;
  end;

  begin
    delete from public.review_helpful_votes h
    where lower(trim(coalesce(h.guest_email, ''))) = v_email;
    get diagnostics v_helpful = row_count;
  exception
    when undefined_table then
      v_helpful := 0;
    when undefined_column then
      v_helpful := 0;
  end;

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'deleted_reviews', v_reviews,
    'deleted_drafts', v_drafts,
    'deleted_otps', v_otps,
    'deleted_helpful', v_helpful
  );
end;
$$;

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
    and coalesce(b.exclude_reviews_from_home_feed, false) = false
    and b.website is not null
    and b.website <> ''
    and not exists (
      select 1
      from public.blocked_emails be
      where be.email = lower(trim(coalesce(r.guest_email, '')))
         or be.email = lower(trim(coalesce(r.author_email, '')))
         or be.email = lower(trim(coalesce(r.email, '')))
         or lower(coalesce(r.title, '')) like '%' || be.email || '%'
         or lower(coalesce(r.body, '')) like '%' || be.email || '%'
    )
    and not exists (
      select 1
      from public.blocked_guest_names bn
      where bn.guest_name = lower(trim(coalesce(r.guest_name, '')))
        and nullif(lower(trim(coalesce(r.guest_email, ''))), '') is null
        and nullif(lower(trim(coalesce(r.author_email, ''))), '') is null
        and nullif(lower(trim(coalesce(r.email, ''))), '') is null
    )
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

comment on view public.home_feed_v2 is
  'Public landing feed; excludes admin-blocked emails/guest names and flagged businesses.';

grant select on public.home_feed_v2 to anon, authenticated;

notify pgrst, 'reload schema';
