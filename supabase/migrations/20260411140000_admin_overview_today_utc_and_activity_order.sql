-- 1) new_users_today / reviews_today: use calendar date in UTC (clear + avoids edge cases
--    around timestamptz vs date_trunc in some sessions).
-- 2) admin_get_recent_activity: when many rows share the same created_at (bulk business seed),
--    order review → user → business so signups and reviews are not buried on identical timestamps.

DROP FUNCTION IF EXISTS public.admin_get_overview_stats();

CREATE OR REPLACE FUNCTION public.admin_get_overview_stats()
RETURNS TABLE (
  total_users bigint,
  total_businesses bigint,
  total_reviews bigint,
  new_users_today bigint,
  reviews_today bigint,
  pending_businesses bigint,
  business_users bigint,
  consumer_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*)::bigint FROM auth.users) AS total_users,
    (SELECT count(*)::bigint FROM public.businesses) AS total_businesses,
    (SELECT count(*)::bigint FROM public.reviews) AS total_reviews,
    (
      SELECT count(*)::bigint
      FROM auth.users u
      WHERE (u.created_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
    ) AS new_users_today,
    (
      SELECT count(*)::bigint
      FROM public.reviews r
      WHERE (r.created_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
    ) AS reviews_today,
    (
      SELECT count(*)::bigint
      FROM public.businesses b
      WHERE
        lower(trim(coalesce(b.submission_status, ''))) IN (
          'pending',
          'submitted',
          'under_review'
        )
        OR b.status = 'under_review'::public.business_status_enum
    ) AS pending_businesses,
    (
      SELECT count(*)::bigint
      FROM public.profiles p
      WHERE lower(trim(coalesce(p.role, ''))) = 'business'
    ) AS business_users,
    (
      SELECT count(*)::bigint
      FROM public.profiles p
      WHERE lower(trim(coalesce(p.role, ''))) = 'consumer'
    ) AS consumer_users;
END;
$function$;

COMMENT ON FUNCTION public.admin_get_overview_stats() IS
  'Admin dashboard aggregates. new_users_today/reviews_today: count where created_at falls on current UTC calendar date; requires is_admin.';

GRANT EXECUTE ON FUNCTION public.admin_get_overview_stats() TO authenticated;

DROP FUNCTION IF EXISTS public.admin_get_recent_activity(integer);
DROP FUNCTION IF EXISTS public.admin_get_recent_activity(integer, integer);

CREATE OR REPLACE FUNCTION public.admin_get_recent_activity(
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  title text,
  subtitle text,
  email text,
  person_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  lim integer;
  off integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND COALESCE(p.is_admin, false) = true
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  lim := LEAST(GREATEST(COALESCE(limit_count, 20), 1), 200);
  off := LEAST(GREATEST(COALESCE(offset_count, 0), 0), 100000);

  RETURN QUERY
  WITH items AS (
    SELECT
      'review'::text AS item_type,
      r.id::uuid AS item_id,
      'Review created'::text AS title,
      COALESCE(b.name::text, '—'::text) AS subtitle,
      NULLIF(
        TRIM(
          BOTH FROM COALESCE(
            r.email::text,
            r.author_email::text,
            r.guest_email::text,
            u.email::text,
            ''::text
          )
        ),
        ''::text
      )::text AS email,
      COALESCE(
        NULLIF(TRIM(BOTH FROM r.guest_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM p.full_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM CONCAT_WS(' ', p.first_name, p.last_name)), ''::text),
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'full_name'), ''::text),
        NULLIF(TRIM(BOTH FROM r.guest_email::text), ''::text),
        NULLIF(TRIM(BOTH FROM u.email::text), ''::text),
        'Guest'::text
      )::text AS person_name,
      r.created_at::timestamptz AS created_at
    FROM public.reviews r
    LEFT JOIN public.businesses b ON b.id = r.business_id
    LEFT JOIN auth.users u ON u.id = COALESCE(r.consumer_id, r.user_id)
    LEFT JOIN public.profiles p ON p.id = COALESCE(r.consumer_id, r.user_id)

    UNION ALL

    SELECT
      'business'::text,
      b.id::uuid,
      'Business created'::text,
      COALESCE(
        NULLIF(TRIM(BOTH FROM bp.business_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM b.name::text), ''::text),
        '—'::text
      )::text AS subtitle,
      NULLIF(
        TRIM(
          BOTH FROM COALESCE(
            u.email::text,
            bp.email::text,
            b.email::text,
            dv.verify_email::text,
            ''::text
          )
        ),
        ''::text
      )::text AS email,
      COALESCE(
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'full_name'), ''::text),
        NULLIF(TRIM(BOTH FROM CONCAT_WS(
          ' ',
          NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'signup_first_name'), ''::text),
          NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'signup_last_name'), ''::text)
        )), ''::text),
        NULLIF(TRIM(BOTH FROM p.full_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM CONCAT_WS(' ', p.first_name, p.last_name)), ''::text),
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'display_name'), ''::text),
        NULLIF(TRIM(BOTH FROM SPLIT_PART(u.email::text, '@', 1)), ''::text),
        'Business Owner'::text
      )::text AS person_name,
      b.created_at::timestamptz
    FROM public.businesses b
    LEFT JOIN public.business_owners bo ON bo.business_id = b.id
    LEFT JOIN auth.users u ON u.id = COALESCE(b.owner_id, bo.owner_user_id)
    LEFT JOIN public.profiles p ON p.id = COALESCE(b.owner_id, bo.owner_user_id)
    LEFT JOIN public.business_profiles bp ON bp.id = COALESCE(b.owner_id, bo.owner_user_id)
    LEFT JOIN LATERAL (
      SELECT bd.email::text AS verify_email
      FROM public.business_domain_verifications bd
      WHERE bd.business_id = b.id
        AND bd.consumed_at IS NOT NULL
        AND bd.email IS NOT NULL
        AND TRIM(BOTH FROM bd.email::text) <> ''
      ORDER BY bd.consumed_at DESC
      LIMIT 1
    ) dv ON TRUE

    UNION ALL

    SELECT
      'user'::text,
      u.id::uuid,
      'New user'::text,
      NULLIF(
        TRIM(
          BOTH FROM COALESCE(
            bp.business_name::text,
            u.raw_user_meta_data->>'signup_company_name',
            ''::text
          )
        ),
        ''::text
      )::text AS subtitle,
      NULLIF(TRIM(BOTH FROM u.email::text), ''::text)::text AS email,
      COALESCE(
        NULLIF(TRIM(BOTH FROM p.full_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM CONCAT_WS(' ', p.first_name, p.last_name)), ''::text),
        NULLIF(TRIM(BOTH FROM CONCAT_WS(
          ' ',
          NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'signup_first_name'), ''::text),
          NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'signup_last_name'), ''::text)
        )), ''::text),
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'full_name'), ''::text),
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'display_name'), ''::text),
        NULLIF(TRIM(BOTH FROM SPLIT_PART(u.email::text, '@', 1)), ''::text),
        'User'::text
      )::text AS person_name,
      u.created_at::timestamptz
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.business_profiles bp ON bp.id = u.id
  )
  SELECT
    i.item_type,
    i.item_id,
    i.title,
    i.subtitle,
    i.email,
    i.person_name,
    i.created_at
  FROM items i
  ORDER BY
    i.created_at DESC,
    (CASE i.item_type
      WHEN 'review' THEN 1
      WHEN 'user' THEN 2
      WHEN 'business' THEN 3
      ELSE 4
    END),
    i.item_id DESC
  LIMIT lim
  OFFSET off;
END;
$function$;

COMMENT ON FUNCTION public.admin_get_recent_activity(integer, integer) IS
  'Admin overview: recent activity (newest first). Same created_at: review before user before business. Requires is_admin.';

GRANT EXECUTE ON FUNCTION public.admin_get_recent_activity(integer, integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
