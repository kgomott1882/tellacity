/** Predefined admin reasons used when suspending a business and notifying the owner. */

export type AdminBusinessSuspensionReasonKey =
  | "general"
  | "guidelines_violation"
  | "fake_or_misleading_listing"
  | "inappropriate_or_unsafe"
  | "repeated_complaints"
  | "verification_or_ownership"
  | "policy_or_legal";

export const ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS: ReadonlyArray<{
  key: AdminBusinessSuspensionReasonKey;
  label: string;
  /** Short line shown in the email body */
  emailLine: string;
  /** Optional extra paragraph (guidance) emailed to the owner */
  softRecipientNote?: string;
}> = [
  {
    key: "general",
    label: "General — does not currently meet platform standards",
    emailLine:
      "Your business listing currently does not meet Tellacity's platform standards.",
  },
  {
    key: "guidelines_violation",
    label: "Violation of community or business guidelines",
    emailLine:
      "We identified content or activity on your listing that violates our community or business guidelines.",
  },
  {
    key: "fake_or_misleading_listing",
    label: "Suspected fake or misleading business listing",
    emailLine:
      "We have concerns that the business listing may be misleading or may not represent a genuine, operating business.",
  },
  {
    key: "inappropriate_or_unsafe",
    label: "Inappropriate, unsafe, or harmful content",
    emailLine:
      "Content associated with your listing was flagged as inappropriate, unsafe, or harmful to consumers.",
  },
  {
    key: "repeated_complaints",
    label: "Repeated user complaints or suspicious activity",
    emailLine:
      "We have received repeated complaints or detected suspicious activity associated with your business.",
    softRecipientNote:
      "Please review your listing and any recent activity. Repeat issues may lead to permanent removal.",
  },
  {
    key: "verification_or_ownership",
    label: "Verification or domain ownership concerns",
    emailLine:
      "We were unable to confirm verification or domain ownership for your business listing.",
  },
  {
    key: "policy_or_legal",
    label: "Policy, legal, or trust & safety concern",
    emailLine:
      "Your listing has been suspended pending review of a policy, legal, or trust & safety concern.",
  },
];

const ALLOWED = new Set<string>(
  ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS.map((o) => o.key)
);

export function isAdminBusinessSuspensionReasonKey(
  v: string
): v is AdminBusinessSuspensionReasonKey {
  return ALLOWED.has(v);
}

export function getAdminBusinessSuspensionReasonLabel(key: string): string {
  const row = ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS.find((o) => o.key === key);
  return row?.label ?? key;
}
