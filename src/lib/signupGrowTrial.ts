import type { SupabaseClient } from "@supabase/supabase-js";
import { provisionReverseTrialIfEligible } from "@/lib/provisionReverseTrial";

export const SIGNUP_GROW_TRIAL_PLAN = "grow" as const;
const METADATA_KEY = "signup_grow_trial_pending";

export function isSignupGrowTrialPlan(plan: string | undefined | null): boolean {
  return String(plan ?? "").trim().toLowerCase() === SIGNUP_GROW_TRIAL_PLAN;
}

/** Wraps the reverse-trial engine for signup completion — no extra eligibility guards. */
export async function maybeProvisionSignupGrowTrial(
  businessId: string,
  db: SupabaseClient
): Promise<{ provisioned: boolean }> {
  const result = await provisionReverseTrialIfEligible(businessId, db);
  return { provisioned: result.provisioned };
}

export function shouldProvisionSignupGrowTrial(
  bodyFlag: boolean | undefined,
  userMetadata: Record<string, unknown> | undefined
): boolean {
  return bodyFlag === true || userMetadata?.[METADATA_KEY] === true;
}

export async function markSignupGrowTrialPending(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await admin.auth.admin.getUserById(userId);
  const existing = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...existing, [METADATA_KEY]: true },
  });
}

export async function clearSignupGrowTrialPending(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await admin.auth.admin.getUserById(userId);
  const existing = { ...((data?.user?.user_metadata ?? {}) as Record<string, unknown>) };
  delete existing[METADATA_KEY];
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: existing,
  });
}

/** After domain verify succeeds, provision Grow trial when signup carried grow intent. */
export async function finishSignupGrowTrialIfRequested(
  admin: SupabaseClient,
  opts: {
    businessId: string;
    userId: string;
    bodyProvisionGrowTrial?: boolean;
    userMetadata?: Record<string, unknown>;
  }
): Promise<void> {
  if (
    !shouldProvisionSignupGrowTrial(opts.bodyProvisionGrowTrial, opts.userMetadata)
  ) {
    return;
  }
  await maybeProvisionSignupGrowTrial(opts.businessId, admin);
  await clearSignupGrowTrialPending(admin, opts.userId);
}
