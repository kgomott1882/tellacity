/** Days a review invite link stays valid after the initial send (or reminder bump). */
export const REVIEW_INVITE_VALID_DAYS = 90;

export function computeReviewInviteExpiresAtIso(from = new Date()): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + REVIEW_INVITE_VALID_DAYS);
  return d.toISOString();
}
