-- =============================================================================
-- Tellacity — Admin manual business create + claim (reference SQL)
--
-- Preferred: use Admin → Businesses → "Add business" or claim panel on an
-- unclaimed business detail page. Those call secured APIs (admin session only).
--
-- Use this SQL only for emergency / one-off fixes in Supabase SQL Editor when
-- you already know the owner's auth.users UUID.
-- =============================================================================

-- 1) Claim an EXISTING unclaimed business for a known user
-- Replace placeholders before running.

/*
begin;

update public.businesses
set
  owner_id = 'OWNER_USER_UUID_HERE',
  is_claimed = true,
  status = 'active',
  submission_status = 'approved'
where id = 'BUSINESS_UUID_HERE'
  and (owner_id is null or owner_id = 'OWNER_USER_UUID_HERE');

insert into public.business_owners (business_id, owner_user_id)
values ('BUSINESS_UUID_HERE', 'OWNER_USER_UUID_HERE')
on conflict (business_id) do update
  set owner_user_id = excluded.owner_user_id;

insert into public.business_profiles (id, email, business_name)
select
  'OWNER_USER_UUID_HERE',
  lower(trim(u.email::text)),
  b.name
from auth.users u
cross join public.businesses b
where u.id = 'OWNER_USER_UUID_HERE'
  and b.id = 'BUSINESS_UUID_HERE'
on conflict (id) do update set
  email = coalesce(excluded.email, public.business_profiles.email),
  business_name = coalesce(excluded.business_name, public.business_profiles.business_name);

commit;
*/

-- 2) Find unclaimed businesses
-- select id, name, website, slug, country_code, status, owner_id, is_claimed
-- from public.businesses
-- where coalesce(is_claimed, false) = false
--   and owner_id is null
-- order by created_at desc
-- limit 50;

-- 3) Find user id by email (service role / SQL editor only)
-- select id, email from auth.users where lower(email) = lower('owner@example.com');

-- 4) Verify claim
-- select b.id, b.name, b.owner_id, b.is_claimed, bo.owner_user_id
-- from public.businesses b
-- left join public.business_owners bo on bo.business_id = b.id
-- where b.id = 'BUSINESS_UUID_HERE';
