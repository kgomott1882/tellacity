import type { SupabaseClient } from "@supabase/supabase-js";
import { parseAccountKind } from "@/lib/accountKind";

/**
 * Whether the account should use the business dashboard (vs consumer `/dashboard`).
 * `user_metadata.account_kind` wins when set (same rules as post-login redirect).
 */
export async function userShouldUseBusinessDashboard(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  userMetadata?: Record<string, unknown> | null
): Promise<boolean> {
  const kind = parseAccountKind(userMetadata ?? null);
  if (kind === "consumer") {
    return false;
  }
  if (kind === "business") {
    return true;
  }

  if (String(userMetadata?.role ?? "").toLowerCase() === "business") {
    return true;
  }

  const { data: bpId } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (bpId) return true;

  const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (emailNorm) {
    const { data: bpEmail } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("email", emailNorm)
      .maybeSingle();
    if (bpEmail) return true;
  }

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (owned) return true;

  const { data: links } = await supabase
    .from("business_owners")
    .select("business_id")
    .eq("owner_user_id", userId)
    .limit(1);
  return Boolean(links?.length);
}

export async function resolveNavbarDashboardPath(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  userMetadata?: Record<string, unknown> | null
): Promise<string> {
  const useBiz = await userShouldUseBusinessDashboard(
    supabase,
    userId,
    email,
    userMetadata
  );
  return useBiz ? "/business/dashboard" : "/dashboard";
}
