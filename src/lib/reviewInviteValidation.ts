/**
 * `review_invites` validation helpers aligned with the live schema:
 * do not assume email, status, or expires_at are present; only branch when keys exist.
 *
 * Dashboard usage (see RecentReviewInvitesCard): includes `review_submitted_at`,
 * `expires_at`, `opened_at`, etc.
 */

export type InviteRowRecord = Record<string, unknown>;

/** Normalize invite token from URLs/copy-paste (e.g. trailing punctuation). */
export function normalizeInviteToken(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  const match = value.match(/[0-9a-f]{64}/i);
  return match ? match[0].toLowerCase() : value.toLowerCase();
}

export function isValidInviteToken(token: string): boolean {
  return /^[0-9a-f]{64}$/i.test(String(token ?? "").trim());
}

function truthyTimestamp(value: unknown): boolean {
  if (value == null) return false;
  const s = String(value).trim();
  return s.length > 0;
}

/** True if the row indicates the invite can no longer be used for a new review. */
export function reviewInviteRowIsUsed(row: InviteRowRecord): boolean {
  // Standardized: only consider the invite used when the review has been submitted.
  return "review_submitted_at" in row && truthyTimestamp(row.review_submitted_at);
}

/** True only when `expires_at` exists and is in the past. */
export function reviewInviteRowIsExpired(row: InviteRowRecord): boolean {
  if (!("expires_at" in row)) return false;
  const e = row.expires_at;
  if (!truthyTimestamp(e)) return false;
  const d = new Date(String(e));
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}
