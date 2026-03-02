import { createClient } from "@supabase/supabase-js";

/** No-op lock to avoid AbortError from auth lock timeout (multiple tabs, unmount, strict mode). */
const noOpLock = async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn();

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      lock: noOpLock,
    },
  }
);
