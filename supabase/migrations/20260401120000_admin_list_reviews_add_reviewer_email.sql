drop function if exists public.admin_list_reviews(text, text, integer, integer);
drop function if exists public.admin_list_reviews(text, text, integer, integer, text);

create or replace function public.admin_list_reviews(
  search_term text,
  verification_filter text,
  limit_count integer,
  offset_count integer,
  moderation_filter text default 'all'
)
returns table (
  review_id uuid,
  business_name text,
  reviewer_email text,
  rating numeric,
  title text,
  body text,
  body_preview text,
  verification_status text,
  status text,
  visibility text,
  is_flagged boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    b.name::text,
    coalesce(nullif(trim(r.guest_email), ''), nullif(trim(u.email::text), '')) as reviewer_email,
    r.rating,
    r.title::text,
    r.body::text,
    left(coalesce(r.body, ''), 200)::text,
    case when r.verified_at is not null then 'verified' else 'unverified' end::text,
    r.status::text,
    r.visibility::text,
    r.is_flagged,
    r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  left join auth.users u on u.id = r.user_id
  where public.is_current_user_admin()
    and (
      search_term is null
      or trim(search_term) = ''
      or b.name ilike '%' || trim(search_term) || '%'
      or coalesce(r.title, '') ilike '%' || trim(search_term) || '%'
      or coalesce(r.body, '') ilike '%' || trim(search_term) || '%'
      or coalesce(r.guest_email, '') ilike '%' || trim(search_term) || '%'
      or coalesce(u.email::text, '') ilike '%' || trim(search_term) || '%'
    )
    and (
      verification_filter is null
      or trim(verification_filter) = ''
      or (lower(trim(verification_filter)) = 'unverified' and r.verified_at is null)
      or (lower(trim(verification_filter)) = 'verified' and r.verified_at is not null)
    )
    and (
      moderation_filter is null
      or trim(moderation_filter) = ''
      or lower(trim(moderation_filter)) = 'all'
      or (lower(trim(moderation_filter)) = 'unverified' and r.verified_at is null)
      or (lower(trim(moderation_filter)) = 'flagged' and r.is_flagged = true)
    )
  order by r.created_at desc
  limit least(greatest(coalesce(nullif(limit_count, 0), 50), 1), 500)
  offset greatest(0, coalesce(offset_count, 0));
$$;

comment on function public.admin_list_reviews(text, text, integer, integer, text) is
  'Admin-only review list; includes reviewer email; moderation_filter all | unverified | flagged.';

grant execute on function public.admin_list_reviews(text, text, integer, integer, text) to authenticated;
