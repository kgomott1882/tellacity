-- admin_get_recent_activity: cast created_at to timestamp (no tz) to match RETURNS TABLE

DROP FUNCTION IF EXISTS public.admin_get_recent_activity(integer);

CREATE OR REPLACE FUNCTION public.admin_get_recent_activity(limit_count integer DEFAULT 20)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  title text,
  subtitle text,
  email text,
  created_at timestamp
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
      r.id AS item_id,
      'Review created'::text AS title,
      COALESCE(b.name::text, '—'::text) AS subtitle,
      NULLIF(
        TRIM(
          BOTH FROM COALESCE(
            r.email,
            r.author_email,
            r.guest_email,
            u.email::text,
            ''::text
          )
        ),
        ''::text
      ) AS email,
      r.created_at::timestamp
    FROM public.reviews r
    LEFT JOIN public.businesses b ON b.id = r.business_id
    LEFT JOIN auth.users u ON u.id = COALESCE(r.consumer_id, r.user_id)

    UNION ALL

    SELECT
      'business'::text,
      b.id,
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
      ),
      b.created_at::timestamp
    FROM public.businesses b
    LEFT JOIN auth.users u ON u.id = b.owner_id
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
      p.id,
      'New user'::text,
      COALESCE(
        NULLIF(TRIM(BOTH FROM bp.business_name::text), ''::text),
        NULLIF(TRIM(BOTH FROM au.raw_user_meta_data->>'signup_company_name'), ''::text),
        '—'::text
      ),
      NULLIF(
        TRIM(BOTH FROM COALESCE(p.email::text, au.email::text, ''::text)),
        ''::text
      ),
      p.created_at::timestamp
    FROM public.profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN public.business_profiles bp ON bp.id = p.id
  )
  SELECT
    i.item_type,
    i.item_id,
    i.title,
    i.subtitle,
    i.email,
    i.created_at
  FROM items i
  ORDER BY i.created_at DESC
  LIMIT GREATEST(limit_count, 1);
END;
$function$;

COMMENT ON FUNCTION public.admin_get_recent_activity(integer) IS
  'Admin overview: reviews, businesses, signups with email (owner, bp, listing, domain OTP). Requires is_admin.';

GRANT EXECUTE ON FUNCTION public.admin_get_recent_activity(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
