import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          headers.set(
            "Cache-Control",
            "no-cache, no-store, max-age=0, must-revalidate",
          );
          headers.set("Pragma", "no-cache");
          return fetch(input, {
            ...init,
            headers,
            cache: "no-store",
          });
        },
      },
    }
  );
}

/**
 * Same credentials as `/api/home-best-in` when `SUPABASE_SERVICE_ROLE_KEY` is set,
 * so homepage SSR matches that route. Falls back to the anon server client in dev
 * if the service role key is missing.
 */
export function createSupabaseServerClientForHomeBestIn() {
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          headers.set(
            "Cache-Control",
            "no-cache, no-store, max-age=0, must-revalidate",
          );
          headers.set("Pragma", "no-cache");
          return fetch(input, {
            ...init,
            headers,
            cache: "no-store",
          });
        },
      },
    });
  } catch {
    return createSupabaseServerClient();
  }
}
