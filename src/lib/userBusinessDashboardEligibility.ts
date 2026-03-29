import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether the account should use the business dashboard (vs consumer `/dashboard`).
 * Aligns with how we load businesses: `business_profiles` shell, `business_owners`, or `owner_id`,
 * plus signup `user_metadata.role === "business"`.
 */
export async function userShouldUseBusinessDashboard(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  userMetadata?: Record<string, unknown> | null
): Promise<boolean> {
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
