import { createClient } from "@supabase/supabase-js";

/**
 * Minimal Supabase client for server-side public reads (widgets, embeds).
 * Uses the anon key — no auth session needed.
 */
export function createWidgetClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
