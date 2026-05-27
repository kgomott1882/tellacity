/** Predefined admin warning reasons (review guidelines notice). Keep keys stable for audit logs. */

export type AdminReviewWarningReasonKey =
  | "general"
  | "promotional"
  | "fake_or_misleading"
  | "duplicate_or_spam"
  | "conflict_or_incentive"
  | "repeated_or_suspicious_activity";

export const ADMIN_REVIEW_WARNING_REASON_OPTIONS: ReadonlyArray<{
  key: AdminReviewWarningReasonKey;
  label: string;
  /** Short line used in the email body */
  emailLine: string;
  /** Optional extra paragraph emailed to the reviewer (guidance), not shown as a separate admin field */
  softRecipientNote?: string;
}> = [
  {
    key: "general",
    label: "General: may not meet community guidelines",
    emailLine:
      "Your review may not fully meet our community guidelines for honest, experience-based feedback.",
  },
  {
    key: "promotional",
    label: "Promotional or marketing-style content",
    emailLine:
      "The content appears promotional or marketing-focused rather than a balanced customer experience.",
  },
  {
    key: "fake_or_misleading",
    label: "Suspected fake, exaggerated, or misleading review",
    emailLine:
      "We have concerns that the review may be misleading or may not reflect a genuine customer experience.",
  },
  {
    key: "duplicate_or_spam",
    label: "Duplicate, spam, or low-quality content",
    emailLine:
      "The review may be duplicate content, spam, or otherwise low-quality under our guidelines.",
  },
  {
    key: "conflict_or_incentive",
    label: "Conflict of interest or incentivised review",
    emailLine:
      "The review may suggest a conflict of interest or an incentivised review, which we handle carefully under our guidelines.",
  },
  {
    key: "repeated_or_suspicious_activity",
    label: "Repeated or suspicious review activity detected",
    emailLine:
      "We have detected repeated or suspicious review activity that may not reflect a genuine customer experience.",
    softRecipientNote:
      "Please ensure your review reflects a genuine customer experience. Reviews that do not meet our guidelines may be removed.",
  },
];

const ALLOWED = new Set<string>(
  ADMIN_REVIEW_WARNING_REASON_OPTIONS.map((o) => o.key)
);

export function isAdminReviewWarningReasonKey(
  v: string
): v is AdminReviewWarningReasonKey {
  return ALLOWED.has(v);
}

export function getAdminReviewWarningReasonLabel(key: string): string {
  const row = ADMIN_REVIEW_WARNING_REASON_OPTIONS.find((o) => o.key === key);
  return row?.label ?? key;
}
