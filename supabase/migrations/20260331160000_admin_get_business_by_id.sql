-- Admin: single business record for detail page.

alter table public.businesses add column if not exists source text;

drop function if exists public.admin_get_business_by_id(uuid);

create or replace function public.admin_get_business_by_id(business_id uuid)
returns table (
  id uuid,
  slug text,
  name text,
  website text,
  email text,
  phone text,
  country_code text,
  category_slug text,
  category_name text,
  source text,
  status text,
  submission_status text,
  owner_user_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    coalesce(b.slug, '')::text as slug,
    coalesce(b.name, '')::text as name,
    coalesce(b.website, '')::text as website,
    coalesce(b.email, '')::text as email,
    coalesce(b.phone, '')::text as phone,
    coalesce(b.country_code, '')::text as country_code,
    coalesce(b.category_slug, '')::text as category_slug,
    coalesce(c.name, b.category_slug, '')::text as category_name,
    coalesce(b.source, '')::text as source,
    coalesce(b.status, 'active')::text as status,
    coalesce(b.submission_status, '')::text as submission_status,
    coalesce(
      b.owner_id,
      (
        select bo.owner_user_id
        from public.business_owners bo
        where bo.business_id = b.id
        order by bo.created_at asc nulls last
        limit 1
      )
    ) as owner_user_id,
    b.created_at
  from public.businesses b
  left join public.categories c on c.slug = b.category_slug
  where public.is_current_user_admin()
    and b.id = business_id;
$$;

comment on function public.admin_get_business_by_id(uuid) is
  'Admin: one business row with category name and resolved owner (owner_id or first business_owners).';

grant execute on function public.admin_get_business_by_id(uuid) to authenticated;
