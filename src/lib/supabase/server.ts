import { createClient } from "@supabase/supabase-js";

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
