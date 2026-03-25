import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Resolves the in-app path after authentication using Supabase:
 * 1. `profiles.is_admin` → `/admin`
 * 2. Else `businesses` row with `owner_id` = user → `/business/dashboard`
 * 3. Else → `/dashboard`
 */
export async function getPostLoginPath(userId: string): Promise<string> {
  const supabase = supabaseBrowser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_admin === true) {
    return "/admin";
  }

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (owned) {
    return "/business/dashboard";
  }

  return "/dashboard";
}

/**
 * Single post-auth navigation. Uses full page load (`window.location.href`) so the
 * session is stable before the next route renders (avoids router races).
 */
export async function handleRedirect(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  const path = await getPostLoginPath(userId);
  const target = `${window.location.origin}${path}`;

  window.location.href = target;
}
