-- Fast O(1) check for admin/service flows. Not granted to anon/authenticated (enumeration).

CREATE OR REPLACE FUNCTION public.service_role_auth_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(u.email) = lower(trim(p_email))
  );
$$;

ALTER FUNCTION public.service_role_auth_email_exists(text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.service_role_auth_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_role_auth_email_exists(text) TO service_role;

COMMENT ON FUNCTION public.service_role_auth_email_exists(text) IS
  'Service role only: whether auth.users has this email.';

NOTIFY pgrst, 'reload schema';
