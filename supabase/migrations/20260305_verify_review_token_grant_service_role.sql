-- Allow the service_role (used by Next.js server) to execute verify_review_token.
-- The verify page uses supabaseServer (SERVICE_ROLE_KEY), which connects as service_role.
grant execute on function public.verify_review_token(uuid) to service_role;
