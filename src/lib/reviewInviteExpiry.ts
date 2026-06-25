/** Days a review invite link stays valid after the initial send (or reminder bump). */
export const REVIEW_INVITE_VALID_DAYS = 90;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeReviewInviteExpiresAtIso(from: Date | string = new Date()): string {
  const base = typeof from === "string" ? new Date(from) : from;
  const ms = base.getTime() + REVIEW_INVITE_VALID_DAYS * MS_PER_DAY;
  return new Date(ms).toISOString();
}

/** Stored TTL shorter than this is treated as a legacy DB-default bug, not policy. */
export const REVIEW_INVITE_MIN_STORED_TTL_MS = 7 * MS_PER_DAY;
