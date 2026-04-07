-- Fix: "structure of query does not match function result type" — UNION branches must match
-- RETURNS TABLE exactly (notably created_at as timestamptz, item_id as uuid).

DROP FUNCTION IF EXISTS public.admin_get_recent_activity(integer);

CREATE OR REPLACE FUNCTION public.admin_get_recent_activity(limit_count integer DEFAULT 20)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  title text,
  subtitle text,
  email text,
  name text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND COALESCE(p.is_admin, false) = true
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

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
      )::text AS name,
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
      COALESCE(b.name::text, '—'::text),
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
      )::text,
      COALESCE(
        NULLIF(TRIM(BOTH FROM p.full_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM CONCAT_WS(' ', p.first_name, p.last_name)), ''::text),
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'full_name'), ''::text),
        NULLIF(TRIM(BOTH FROM u.email::text), ''::text),
        'Business Owner'::text
      )::text,
      b.created_at::timestamptz
    FROM public.businesses b
    LEFT JOIN auth.users u ON u.id = b.owner_id
    LEFT JOIN public.profiles p ON p.id = b.owner_id
    LEFT JOIN public.business_profiles bp ON bp.id = b.owner_id
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
      )::text,
      NULLIF(TRIM(BOTH FROM u.email::text), ''::text)::text,
      COALESCE(
        NULLIF(TRIM(BOTH FROM p.full_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM CONCAT_WS(' ', p.first_name, p.last_name)), ''::text),
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'full_name'), ''::text),
        NULLIF(TRIM(BOTH FROM u.raw_user_meta_data->>'display_name'), ''::text),
        SPLIT_PART(u.email::text, '@', 1)::text,
        'User'::text
      )::text,
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
    i.name,
    i.created_at
  FROM items i
  ORDER BY i.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(limit_count, 20), 1), 200);
END;
$function$;

COMMENT ON FUNCTION public.admin_get_recent_activity(integer) IS
  'Admin overview: reviews, businesses, signups (business name on signup). Requires is_admin.';

GRANT EXECUTE ON FUNCTION public.admin_get_recent_activity(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
