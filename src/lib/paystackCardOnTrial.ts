/**
 * Feature gate for Paystack card-on-trial (Build 1+). Off by default in production
 * until all Paystack trial builds are verified.
 *
 * Enable for local/staging testing:
 *   FEATURE_PAYSTACK_CARD_ON_TRIAL=true
 *   NEXT_PUBLIC_FEATURE_PAYSTACK_CARD_ON_TRIAL=true
 *
 * Dev-only simulated charge decline (sk_test_ + non-production only):
 *   FEATURE_PAYSTACK_SIMULATE_CHARGE_DECLINE=true
 *
 * Both must be set: server gates APIs; client chooses card-capture vs no-card start-trial.
 */

function parseTruthyEnv(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase() ?? "";
  return v === "true" || v === "1" || v === "yes";
}

/** Server routes: card capture APIs and gated start-trial behavior. */
export function isPaystackCardOnTrialEnabled(): boolean {
  return parseTruthyEnv(process.env.FEATURE_PAYSTACK_CARD_ON_TRIAL);
}

/** Server routes: monthly stored-card renewal (Build 2.5). Off until explicitly enabled. */
export function isPaystackRecurringRenewalEnabled(): boolean {
  return parseTruthyEnv(process.env.FEATURE_PAYSTACK_RECURRING_RENEWAL);
}

/** Browser: trial CTAs redirect to Paystack card capture when true. */
export function isPaystackCardOnTrialEnabledPublic(): boolean {
  return parseTruthyEnv(process.env.NEXT_PUBLIC_FEATURE_PAYSTACK_CARD_ON_TRIAL);
}
