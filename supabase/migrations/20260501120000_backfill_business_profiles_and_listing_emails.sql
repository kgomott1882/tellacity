-- Backfill data created before app code stored it: admin "Recent activity" and consistency.
-- Safe to re-run: only fills empty fields or inserts missing business_profiles rows.

-- Minimal shell if an environment never had the table (production usually already has it).
create table if not exists public.business_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  business_name text,
  created_at timestamptz not null default now()
);

-- 1) From signup metadata (business verify-code flow).
insert into public.business_profiles (id, email, business_name)
select
  u.id,
  nullif(lower(trim(both from coalesce(u.email::text, ''))), ''),
  nullif(trim(both from coalesce(u.raw_user_meta_data->>'signup_company_name', '')), '')
from auth.users u
where nullif(trim(both from coalesce(u.raw_user_meta_data->>'signup_company_name', '')), '') is not null
on conflict (id) do update set
  email = coalesce(
    nullif(trim(both from public.business_profiles.email), ''),
    excluded.email
  ),
  business_name = coalesce(
    nullif(trim(both from public.business_profiles.business_name), ''),
    excluded.business_name
  );

-- 2) Business-role users still missing business_name: use their owned business listing name (e.g. Haregon).
insert into public.business_profiles (id, email, business_name)
select
  u.id,
  nullif(lower(trim(both from coalesce(u.email::text, ''))), ''),
  nullif(trim(both from sub.name), '')
from auth.users u
inner join lateral (
  select b.name
  from public.businesses b
  where b.owner_id = u.id
  order by b.created_at desc nulls last
  limit 1
) sub on true
where coalesce(u.raw_user_meta_data->>'role', '') ilike 'business'
  and nullif(trim(both from sub.name), '') is not null
on conflict (id) do update set
  email = coalesce(
    nullif(trim(both from public.business_profiles.email), ''),
    excluded.email
  ),
  business_name = coalesce(
    nullif(trim(both from public.business_profiles.business_name), ''),
    excluded.business_name
  );

-- 3) Listing contact email when owner is known and businesses.email is empty.
update public.businesses b
set email = coalesce(nullif(trim(both from b.email), ''), nullif(trim(both from u.email::text), ''))
from auth.users u
where b.owner_id = u.id
  and (b.email is null or trim(both from b.email) = '');

-- 4) Draft / OTP flows: copy verifier work email from business_domain_verifications when businesses.email still empty.
update public.businesses b
set email = coalesce(nullif(trim(both from b.email), ''), nullif(lower(trim(both from v.email)), ''))
from (
  select distinct on (business_id)
    business_id,
    email
  from public.business_domain_verifications
  where consumed_at is not null
    and email is not null
    and trim(both from email) <> ''
  order by business_id, consumed_at desc
) v
where b.id = v.business_id
  and (b.email is null or trim(both from b.email) = '');

notify pgrst, 'reload schema';
