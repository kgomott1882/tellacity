import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** No-op lock to avoid AbortError from auth lock timeout (multiple tabs, unmount, strict mode). */
const noOpLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

let _browserClient: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (_browserClient) return _browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("supabaseUrl is required.");
  }

  _browserClient = createClient(url, anon, {
    auth: {
      lock: noOpLock,
    },
  });

  return _browserClient;
}
