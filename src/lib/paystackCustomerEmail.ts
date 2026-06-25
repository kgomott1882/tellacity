import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

function isLikelyValidEmail(raw: string): boolean {
  const s = raw.trim();
  return s.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * Paystack requires a valid customer email on initialize.
 * Priority: auth.users → profiles.email → businesses.email.
 */
export async function resolveCustomerEmailForPaystack(
  userId: string,
  businessId: string,
): Promise<string | null> {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(userId);
  if (!authErr) {
    const authEmail = authData?.user?.email?.trim();
    if (authEmail && isLikelyValidEmail(authEmail)) {
      return authEmail;
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const profileEmail =
    profile && typeof (profile as { email?: unknown }).email === "string"
      ? (profile as { email: string }).email.trim()
      : "";
  if (profileEmail && isLikelyValidEmail(profileEmail)) {
    return profileEmail;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("email")
    .eq("id", businessId)
    .maybeSingle();
  const bizEmail =
    business && typeof (business as { email?: unknown }).email === "string"
      ? (business as { email: string }).email.trim()
      : "";
  if (bizEmail && isLikelyValidEmail(bizEmail)) {
    return bizEmail;
  }

  return null;
}

export { isLikelyValidEmail };
