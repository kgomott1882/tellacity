-- Backfill auth.user_metadata.account_kind for routing (consumer vs business dashboard).
-- Run in Supabase SQL Editor if you do not use CLI migrations.
--
-- Rules:
-- 1) business: metadata role = 'business', OR signup_company_name present (business signup flow),
--    OR a business_profiles row exists for that user id.
-- 2) everyone else still missing account_kind → consumer.
--
-- If someone should stay consumer despite a business_profiles shell row, run:
--   UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"account_kind":"consumer"}'::jsonb
--   WHERE email = 'their@email';

UPDATE auth.users u
SET raw_user_meta_data =
  COALESCE(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('account_kind', 'business')
WHERE COALESCE(u.raw_user_meta_data->>'account_kind', '') = ''
  AND (
    LOWER(COALESCE(u.raw_user_meta_data->>'role', '')) = 'business'
    OR (u.raw_user_meta_data ? 'signup_company_name')
    OR EXISTS (
      SELECT 1 FROM public.business_profiles bp WHERE bp.id = u.id
    )
  );

UPDATE auth.users u
SET raw_user_meta_data =
  COALESCE(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('account_kind', 'consumer')
WHERE COALESCE(u.raw_user_meta_data->>'account_kind', '') = '';
