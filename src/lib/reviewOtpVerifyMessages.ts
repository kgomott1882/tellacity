/** Matches `error_code` from POST /api/reviews/verify (guest email OTP). */
export type ReviewVerifyErrorCode =
  | "invalid_request"
  | "wrong_code"
  | "otp_expired"
  | "otp_used"
  | "otp_missing"
  | "draft_not_found"
  | "duplicate_review"
  | "product_review_rate_limit"
  | "same_domain_as_business"
  | "server_error";

export function messageForReviewVerifyError(
  code: ReviewVerifyErrorCode | string | undefined,
  fallback: string
): string {
  switch (code) {
    case "wrong_code":
      return "That code does not match the one we sent. Check the number and try again.";
    case "otp_expired":
      return "That code has expired. Tap Resend code for a new one.";
    case "otp_used":
      return "This code was already used. Tap Resend code if you need a new one.";
    case "otp_missing":
      return "This verification session expired or was already completed. Tap Resend code, or submit your review again to get a fresh code.";
    case "draft_not_found":
      return "We couldn’t find your draft. Please submit your review again.";
    case "duplicate_review":
      // Server sends product vs business wording in the `error` body; prefer it over a generic line.
      if (fallback.trim().length > 0) {
        return fallback;
      }
      return "You have already reviewed this business.";
    case "product_review_rate_limit":
      return "You're reviewing too quickly. Please try again later.";
    case "same_domain_as_business":
      return "You can’t use a work email for this business. Please leave a review from a personal email address.";
    case "invalid_request":
      return "Enter the 6-digit code from your email.";
    case "server_error":
      return "We couldn’t publish your review. Please try again in a moment.";
    default:
      return fallback;
  }
}
