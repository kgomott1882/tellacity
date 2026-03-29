import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Light session touch only. Do NOT sign out when `business_owners` is empty or RLS
 * blocks that table — new signups and owner_id-only accounts are valid.
 */
export async function ensureValidSession() {
  const supabase = supabaseBrowser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return;

  try {
    await supabase.auth.getUser();
  } catch {
    // AbortError / network: do not clear session here
  }
}
