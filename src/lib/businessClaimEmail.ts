import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Business claim confirmation emails are intentionally disabled.
 * Owners land in the dashboard after verify/signup; sales no longer gets a claim notice.
 * Other transactional email (reviews, OTP, moderation, etc.) is unchanged.
 */
export async function sendBusinessClaimSuccessEmails(_input: {
  toEmail: string;
  businessName: string;
  fullName: string;
  countryCode?: string;
}): Promise<void> {
  return;
}

/** No-op — kept for call-site compatibility after domain claim / signup verify. */
export async function notifyBusinessClaimSuccess(
  _admin: SupabaseClient,
  _user: User,
  _businessId: string
): Promise<void> {
  return;
}
