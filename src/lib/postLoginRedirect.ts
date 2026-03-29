import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getUserBusinesses } from "@/lib/getUserBusinesses";

export type PostLoginContext = "default" | "business";

/**
 * Resolves the in-app path after authentication using DB state only.
 *
 * - Owned businesses (`getUserBusinesses` → `business_owners.owner_user_id`) → `/business/dashboard`.
 * - No ownership but a `business_profiles` row for this user → `/business/dashboard` (shell shows empty/recovery; not consumer dashboard).
 * - Explicit `context: "business"` (e.g. /business/login) → `/business/dashboard` even if profile row is missing yet.
 * - Otherwise → consumer `/dashboard`.
 */
export async function getPostLoginPath(
  userId: string,
  context: PostLoginContext = "default"
): Promise<string> {
  const supabase = supabaseBrowser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_admin === true) {
    return "/admin";
  }

  const ownedBusinesses = await getUserBusinesses(userId);
  if (ownedBusinesses.length > 0) {
    return "/business/dashboard";
  }

  if (context === "business") {
    return "/business/dashboard";
  }

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (businessProfile) {
    return "/business/dashboard";
  }

  return "/dashboard";
}

/**
 * Single post-auth navigation. Uses full page load (`window.location.href`) so the
 * session is stable before the next route renders (avoids router races).
 */
export async function handleRedirect(
  userId: string,
  options?: { context?: PostLoginContext }
): Promise<void> {
  if (typeof window === "undefined") return;

  const path = await getPostLoginPath(userId, options?.context ?? "default");
  const target = `${window.location.origin}${path}`;

  window.location.href = target;
}
