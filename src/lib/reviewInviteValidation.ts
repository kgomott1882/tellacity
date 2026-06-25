/**
 * `review_invites` validation helpers aligned with the live schema:
 * do not assume email, status, or expires_at are present; only branch when keys exist.
 *
 * Dashboard usage (see RecentReviewInvitesCard): includes `review_submitted_at`,
 * `expires_at`, `opened_at`, etc.
 */

import {
  REVIEW_INVITE_MIN_STORED_TTL_MS,
  computeReviewInviteExpiresAtIso,
} from "@/lib/reviewInviteExpiry";

export type InviteRowRecord = Record<string, unknown>;

function truthyTimestamp(value: unknown): boolean {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0;
}

/** Anchor for invite validity: first send time, else row creation. */
export function getReviewInviteAnchorDate(row: InviteRowRecord): Date | null {
  const raw = row.sent_at ?? row.created_at;
  if (!truthyTimestamp(raw)) return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** True if the row indicates the invite can no longer be used for a new review. */
export function reviewInviteRowIsUsed(row: InviteRowRecord): boolean {
  return "review_submitted_at" in row && truthyTimestamp(row.review_submitted_at);
}

/**
 * Effective expiry: at least 90 days from sent/created.
 * Ignores legacy short `expires_at` values (bad DB defaults).
 */
export function getReviewInviteEffectiveExpiresAtIso(
  row: InviteRowRecord,
): string | null {
  const anchor = getReviewInviteAnchorDate(row);
  if (!anchor) {
    if (!("expires_at" in row) || !truthyTimestamp(row.expires_at)) return null;
    return String(row.expires_at);
  }

  const policyEndIso = computeReviewInviteExpiresAtIso(anchor);
  const policyEndMs = new Date(policyEndIso).getTime();

  if (!("expires_at" in row) || !truthyTimestamp(row.expires_at)) {
    return policyEndIso;
  }

  const storedMs = new Date(String(row.expires_at)).getTime();
  if (Number.isNaN(storedMs)) return policyEndIso;

  if (storedMs - anchor.getTime() < REVIEW_INVITE_MIN_STORED_TTL_MS) {
    return policyEndIso;
  }

  return storedMs > policyEndMs
    ? new Date(storedMs).toISOString()
    : policyEndIso;
}

/** True when stored `expires_at` should be rewritten to the 90-day policy. */
export function reviewInviteNeedsExpiresAtHeal(row: InviteRowRecord): boolean {
  if (reviewInviteRowIsUsed(row)) return false;
  const effective = getReviewInviteEffectiveExpiresAtIso(row);
  if (!effective) return false;
  if (!("expires_at" in row) || !truthyTimestamp(row.expires_at)) return true;
  return String(row.expires_at) !== effective;
}

/** True only when the effective expiry (not bogus stored TTL) is in the past. */
export function reviewInviteRowIsExpired(row: InviteRowRecord): boolean {
  const effective = getReviewInviteEffectiveExpiresAtIso(row);
  if (!effective) return false;
  const ms = new Date(effective).getTime();
  if (Number.isNaN(ms)) return false;
  return ms < Date.now();
}
