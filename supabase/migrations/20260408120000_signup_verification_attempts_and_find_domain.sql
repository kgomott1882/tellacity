-- OTP verification hardening + exact domain lookup for business signup.

alter table public.business_signup_verifications
  add column if not exists attempt_count integer not null default 0;

alter table public.business_signup_verifications
  add column if not exists consumed_at timestamptz null;

comment on column public.business_signup_verifications.attempt_count is
  'Failed OTP verification attempts for this row; row deleted after 5 failures.';

comment on column public.business_signup_verifications.consumed_at is
  'Set when OTP is consumed successfully; prevents reuse of the same row.';

-- Match normalizeBusinessDomain() in app (host only, lowercase, no path).
create or replace function public.normalize_business_website_domain(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both from (
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(trim(coalesce(raw, ''))), '^https?://', '', 'i'),
          '^www\.', '',
          'i'
        ),
        '/.*$',
        ''
      )
    )),
    ''
  );
$$;

-- One active business per normalized website host (oldest first).
create or replace function public.find_active_business_by_domain(p_domain text)
returns table (
  id uuid,
  name text,
  website text
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.name, b.website
  from public.businesses b
  where b.status = 'active'
    and public.normalize_business_website_domain(b.website) = lower(trim(coalesce(p_domain, '')))
  order by b.created_at asc
  limit 1;
$$;

grant execute on function public.find_active_business_by_domain(text) to anon, authenticated;
grant execute on function public.normalize_business_website_domain(text) to anon, authenticated;

comment on function public.find_active_business_by_domain(text) is
  'Public signup: return first active business whose website host equals the given domain (exact match after normalization).';
