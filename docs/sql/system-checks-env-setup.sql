-- System status deep checks — pick IDs and verify test data
-- Run in Supabase SQL Editor. Env vars go in Vercel (or .env.local), not in SQL.

-- 1) Pick an active business for SYSTEM_CHECK_BUSINESS_ID (or use slug env below)
select
  id,
  slug,
  name,
  status,
  created_at
from public.businesses
where status = 'active'
order by created_at desc
limit 20;

-- 2) Resolve a slug → UUID (copy id into SYSTEM_CHECK_BUSINESS_ID or set SYSTEM_CHECK_BUSINESS_SLUG)
-- select id, slug, name from public.businesses where slug = 'your-business-slug' and status = 'active';

-- 3) Find auth user for SYSTEM_CHECK_USER_ID (or set SYSTEM_CHECK_USER_EMAIL only)
select
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  p.display_name
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('monitoring@yourdomain.com');

-- 4) After a check run, confirm the synthetic review was cleaned up / re-created
-- select id, business_id, user_id, title, status, created_at
-- from public.reviews
-- where title = 'System Health Check'
-- order by created_at desc
-- limit 5;

/*
Vercel / production env (Admin → System status → Run all checks now):

  SYSTEM_CHECK_USER_EMAIL=monitoring@yourdomain.com
  SYSTEM_CHECK_USER_PASSWORD=<strong password>
  SYSTEM_CHECK_BUSINESS_ID=<uuid from query 1>
  -- optional if you prefer slug:
  -- SYSTEM_CHECK_BUSINESS_SLUG=<slug from query 1>
  -- optional if email lookup is slow; otherwise derived from SYSTEM_CHECK_USER_EMAIL:
  -- SYSTEM_CHECK_USER_ID=<uuid from query 3>

Create the test user in Supabase Dashboard → Authentication → Users → Add user
(email confirmed + password). Use a dedicated monitoring account, not a real customer.

NEXT_PUBLIC_SUPABASE_ANON_KEY should already be set (core_anon_key check passes).

After saving env vars, redeploy (or restart dev) and click "Run all checks now".
Ongoing incidents for user_login / write_review_logged_in resolve on the next ok run.
*/
