import { parseAccountKind } from "@/lib/accountKind";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getUserBusinesses } from "@/lib/getUserBusinesses";

export type PostLoginContext = "default" | "business";

/**
 * Resolves the in-app path after authentication.
 *
 * 1. Admin → `/admin`.
 * 2. `user_metadata.account_kind` (set at signup) is authoritative when present:
 *    - `consumer` → `/dashboard`
 *    - `business` → `/business/dashboard`
 * 3. Legacy users without `account_kind`: same routing as before (ownership, business_profiles, role, login surface).
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

  const { data: authData } = await supabase.auth.getUser();
  const sessionUser =
    authData?.user?.id === userId ? authData.user : null;
  const md = sessionUser?.user_metadata ?? {};
  const accountKind = parseAccountKind(md);

  if (accountKind === "consumer") {
    return "/dashboard";
  }
  if (accountKind === "business") {
    return "/business/dashboard";
  }

  const ownedBusinesses = await getUserBusinesses(userId);
  if (ownedBusinesses.length > 0) {
    return "/business/dashboard";
  }

  if (String(md.role ?? "").toLowerCase() === "business") {
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
