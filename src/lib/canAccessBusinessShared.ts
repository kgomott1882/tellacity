import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether the user may access this business in the dashboard (owner, co-owner, or active member).
 * Same rules as server-side checks; safe to call from the browser Supabase client.
 */
export async function canAccessBusiness(
  supabase: SupabaseClient,
  userId: string,
  businessId: string
): Promise<boolean> {
  const trimmed = businessId?.trim();
  if (!trimmed || !userId) return false;

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", trimmed)
    .eq("owner_id", userId)
    .maybeSingle();

  if (owned) return true;

  const { data: link, error } = await supabase
    .from("business_owners")
    .select("business_id")
    .eq("business_id", trimmed)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST205") return false;
  if (link) return true;

  const { data: member, error: memErr } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", trimmed)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (memErr && memErr.code !== "PGRST205") return false;
  return !!member;
}
