import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("supabaseBrowser() should only be called in the browser.");
  }

  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing. Check Vercel environment settings."
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  });
  return client;
}

/**
 * Same singleton instance as `supabaseBrowser()` — use `import { supabase } from "@/lib/supabaseBrowser"`.
 * Delegates every property access to the shared browser client (anon key + persisted session / cookies).
 * Client components only.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const c = supabaseBrowser();
    const value = Reflect.get(c as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(c);
    }
    return value;
  },
});
