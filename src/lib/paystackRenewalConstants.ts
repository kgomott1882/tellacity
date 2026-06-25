/**
 * Card-on-trial Build 2.5 — monthly renewal grace and retry tuning.
 * Adjust here; cron and charge logic read these constants.
 */

/** Paid access continues until this many days after the first renewal failure. */
export const RENEWAL_GRACE_DAYS = 5;

/** Maximum charge attempts per billing cycle (initial + retries). */
export const RENEWAL_MAX_RETRIES = 3;

/**
 * Retry schedule as day offsets from {@link renewal_failed_at} (UTC calendar days).
 * e.g. first retry on day 1, second on day 3, third on day 5.
 */
export const RENEWAL_RETRY_DAY_OFFSETS = [1, 3, 5] as const;

export const PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE = "trial_end_conversion" as const;

export const PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE = "subscription_renewal" as const;
