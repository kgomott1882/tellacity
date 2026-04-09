-- Fix "new users today" / "reviews today" when DB session TimeZone is not UTC.
-- Naive `date_trunc(..., now() AT TIME ZONE 'utc')` compared to timestamptz uses
-- session TZ for coercion; use UTC midnight as timestamptz instead.
--
-- Postgres cannot change RETURNS TABLE shape with CREATE OR REPLACE; DROP first.

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
      WHERE u.created_at >= (date_trunc('day', timezone('utc', now())) AT TIME ZONE 'utc')
    ) AS new_users_today,
    (
      SELECT count(*)::bigint
      FROM public.reviews r
      WHERE r.created_at >= (date_trunc('day', timezone('utc', now())) AT TIME ZONE 'utc')
    ) AS reviews_today,
    (
      SELECT count(*)::bigint
      FROM public.businesses b
      WHERE coalesce(b.submission_status, '') IN ('pending', 'submitted')
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
  'Admin dashboard aggregates. new_users_today/reviews_today: current UTC calendar day; requires is_admin.';

GRANT EXECUTE ON FUNCTION public.admin_get_overview_stats() TO authenticated;
