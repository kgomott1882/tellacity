/** Single browser client: re-export to avoid "Multiple GoTrueClient instances" and undefined behavior. */
export { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
