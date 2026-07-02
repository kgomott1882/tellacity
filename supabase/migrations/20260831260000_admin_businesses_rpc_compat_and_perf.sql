-- Admin businesses RPC: paginate-first (performance) + 8-arg overloads (PostgREST / legacy clients).

create index if not exists businesses_admin_list_created_at_idx
  on public.businesses (created_at desc nulls last, id desc);

drop function if exists public.admin_list_businesses_v2(text, text, text, text, text, integer, integer);
drop function if exists public.admin_list_businesses_v2(text, text, text, text, text, text, integer, integer);
drop function if exists public.admin_list_businesses_v2(text, text, text, text, text, text, text, integer, integer);

create or replace function public.admin_list_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text,
  risk_filter text,
  limit_count integer,
  offset_count integer
)
returns table (
  business_id uuid,
  id uuid,
  name text,
  website text,
  country text,
  country_code text,
  status text,
  submission_status text,
  category text,
  category_slug text,
  is_review_restricted boolean,
  exclude_reviews_from_home_feed boolean,
  highest_review_risk text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  perform set_config('statement_timeout', '25000', true);

  if not public.is_current_user_admin() then
    return;
  end if;

  return query
  with page as (
    select
      b.id as page_id,
      b.name,
      b.website,
      b.country_code,
      b.status,
      b.submission_status,
      b.category_slug,
      b.is_review_restricted,
      b.exclude_reviews_from_home_feed,
      b.created_at
    from public.businesses b
    where (
        search_term is null
        or length(trim(search_term)) = 0
        or b.name ilike '%' || trim(search_term) || '%'
        or b.id::text ilike '%' || trim(search_term) || '%'
        or replace(b.id::text, '-', '') ilike '%' || replace(trim(search_term), '-', '') || '%'
      )
      and (
        status_filter is null
        or length(trim(status_filter)) = 0
        or lower(trim(coalesce(b.status::text, 'active'))) = lower(trim(status_filter))
      )
      and (
        submission_filter is null
        or length(trim(submission_filter)) = 0
        or lower(trim(coalesce(b.submission_status::text, ''))) = lower(trim(submission_filter))
      )
      and (
        country_filter is null
        or length(trim(country_filter)) = 0
        or upper(trim(coalesce(b.country_code, ''))) = upper(trim(country_filter))
      )
      and (
        category_filter is null
        or length(trim(category_filter)) = 0
        or lower(trim(coalesce(b.category_slug, ''))) = lower(trim(category_filter))
      )
      and (
        admin_action_filter is null
        or length(trim(admin_action_filter)) = 0
        or (
          lower(trim(admin_action_filter)) in ('activate', 'approved')
          and lower(trim(coalesce(b.status::text, 'active'))) = 'active'
          and lower(trim(coalesce(b.submission_status::text, ''))) = 'approved'
        )
        or (
          lower(trim(admin_action_filter)) = 'suspended'
          and lower(trim(coalesce(b.status::text, ''))) = 'suspended'
        )
        or (
          lower(trim(admin_action_filter)) = 'under_review'
          and lower(trim(coalesce(b.status::text, ''))) = 'under_review'
        )
        or (
          lower(trim(admin_action_filter)) = 'restrict'
          and coalesce(b.is_review_restricted, false) = true
        )
        or (
          lower(trim(admin_action_filter)) = 'hide_landing'
          and coalesce(b.exclude_reviews_from_home_feed, false) = true
        )
      )
      and (
        risk_filter is null
        or length(trim(risk_filter)) = 0
        or b.id in (
          select distinct r.business_id
          from public.reviews r
          where lower(trim(coalesce(r.risk_status, ''))) = lower(trim(risk_filter))
        )
      )
    order by b.created_at desc nulls last, b.id desc
    limit least(greatest(coalesce(limit_count, 50), 1), 1000)
    offset greatest(coalesce(offset_count, 0), 0)
  ),
  biz_highest_risk as (
    select distinct on (r.business_id)
      r.business_id,
      r.risk_status as highest_review_risk
    from public.reviews r
    where r.business_id in (select pg.page_id from page pg)
      and r.risk_status is not null
      and trim(r.risk_status) <> ''
    order by
      r.business_id,
      case lower(trim(r.risk_status))
        when 'high' then 3
        when 'medium' then 2
        when 'low' then 1
        else 0
      end desc,
      r.created_at desc
  )
  select
    p.page_id,
    p.page_id,
    coalesce(p.name, '')::text,
    coalesce(p.website, '')::text,
    coalesce(p.country_code, '')::text,
    coalesce(p.country_code, '')::text,
    coalesce(p.status::text, 'active'),
    coalesce(p.submission_status::text, ''),
    coalesce(c.name, p.category_slug, '')::text,
    coalesce(p.category_slug, '')::text,
    coalesce(p.is_review_restricted, false),
    coalesce(p.exclude_reviews_from_home_feed, false),
    biz_risk.highest_review_risk,
    p.created_at
  from page p
  left join public.categories c on c.slug = p.category_slug
  left join biz_highest_risk biz_risk on biz_risk.business_id = p.page_id
  order by p.created_at desc nulls last, p.page_id desc;
end;
$$;

-- Legacy 8-arg signature (no risk_filter) for PostgREST clients that omit the param.
create or replace function public.admin_list_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text,
  limit_count integer,
  offset_count integer
)
returns table (
  business_id uuid,
  id uuid,
  name text,
  website text,
  country text,
  country_code text,
  status text,
  submission_status text,
  category text,
  category_slug text,
  is_review_restricted boolean,
  exclude_reviews_from_home_feed boolean,
  highest_review_risk text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.admin_list_businesses_v2(
    search_term,
    status_filter,
    submission_filter,
    country_filter,
    category_filter,
    admin_action_filter,
    null::text,
    limit_count,
    offset_count
  );
$$;

grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, text, text, integer, integer)
  to authenticated;
grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, text, integer, integer)
  to authenticated;

drop function if exists public.admin_count_businesses_v2(text, text, text);
drop function if exists public.admin_count_businesses_v2(text, text, text, text, text);
drop function if exists public.admin_count_businesses_v2(text, text, text, text, text, text);

create or replace function public.admin_count_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text,
  risk_filter text
)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  total bigint;
begin
  perform set_config('statement_timeout', '25000', true);

  if not public.is_current_user_admin() then
    return 0;
  end if;

  select count(*)::bigint
  into total
  from public.businesses b
  where (
      search_term is null
      or length(trim(search_term)) = 0
      or b.name ilike '%' || trim(search_term) || '%'
      or b.id::text ilike '%' || trim(search_term) || '%'
      or replace(b.id::text, '-', '') ilike '%' || replace(trim(search_term), '-', '') || '%'
    )
    and (
      status_filter is null
      or length(trim(status_filter)) = 0
      or lower(trim(coalesce(b.status::text, 'active'))) = lower(trim(status_filter))
    )
    and (
      submission_filter is null
      or length(trim(submission_filter)) = 0
      or lower(trim(coalesce(b.submission_status::text, ''))) = lower(trim(submission_filter))
    )
    and (
      country_filter is null
      or length(trim(country_filter)) = 0
      or upper(trim(coalesce(b.country_code, ''))) = upper(trim(country_filter))
    )
    and (
      category_filter is null
      or length(trim(category_filter)) = 0
      or lower(trim(coalesce(b.category_slug, ''))) = lower(trim(category_filter))
    )
    and (
      admin_action_filter is null
      or length(trim(admin_action_filter)) = 0
      or (
        lower(trim(admin_action_filter)) in ('activate', 'approved')
        and lower(trim(coalesce(b.status::text, 'active'))) = 'active'
        and lower(trim(coalesce(b.submission_status::text, ''))) = 'approved'
      )
      or (
        lower(trim(admin_action_filter)) = 'suspended'
        and lower(trim(coalesce(b.status::text, ''))) = 'suspended'
      )
      or (
        lower(trim(admin_action_filter)) = 'under_review'
        and lower(trim(coalesce(b.status::text, ''))) = 'under_review'
      )
      or (
        lower(trim(admin_action_filter)) = 'restrict'
        and coalesce(b.is_review_restricted, false) = true
      )
      or (
        lower(trim(admin_action_filter)) = 'hide_landing'
        and coalesce(b.exclude_reviews_from_home_feed, false) = true
      )
    )
    and (
      risk_filter is null
      or length(trim(risk_filter)) = 0
      or b.id in (
        select distinct r.business_id
        from public.reviews r
        where lower(trim(coalesce(r.risk_status, ''))) = lower(trim(risk_filter))
      )
    );

  return coalesce(total, 0);
end;
$$;

create or replace function public.admin_count_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_count_businesses_v2(
    search_term,
    status_filter,
    submission_filter,
    country_filter,
    category_filter,
    admin_action_filter,
    null::text
  );
$$;

grant execute on function public.admin_count_businesses_v2(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_count_businesses_v2(text, text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
