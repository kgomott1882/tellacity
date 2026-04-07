-- business_activity_logs: Edge + API use service role to INSERT.
-- If RLS was enabled manually, DISABLE prevents empty-policy blocks for service_role clients.
ALTER TABLE IF EXISTS public.business_activity_logs DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.business_activity_logs TO service_role;
GRANT SELECT ON public.business_activity_logs TO authenticated;
