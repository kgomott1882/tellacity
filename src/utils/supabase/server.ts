import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side Supabase client for use in App Router server components and route handlers.
 * Use this instead of the browser client for data fetching on the server.
 */
export function createClient() {
  return createSupabaseServerClient();
}
