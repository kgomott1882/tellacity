-- Fix: "permission denied for table business_owners" from dashboard APIs / RLS.
-- Policies on business_notification_preferences (and canAccessBusiness) read business_owners
-- and business_members; role "authenticated" must have SELECT on those tables.

grant select on table public.business_owners to authenticated;
grant select on table public.business_members to authenticated;

-- Table created in 20260615120000; ensure app role can read/write prefs.
grant select, insert, update on table public.business_notification_preferences to authenticated;
