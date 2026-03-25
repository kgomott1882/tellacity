export const reviewErrorMessages: Record<
  string,
  { title: string; message: string }
> = {
  duplicate_review: {
    title: "You’ve already submitted a review for this business.",
    message:
      "You can edit your existing review if you'd like to update your experience.",
  },

  draft_exists: {
    title: "Finish your review",
    message:
      "You already started a review for this business. Check your email for the verification code to publish it.",
  },

  otp_invalid: {
    title: "Invalid verification code",
    message: "The code you entered is incorrect. Please try again.",
  },

  otp_expired: {
    title: "Verification code expired",
    message:
      "Your code expired. Please request a new verification code.",
  },

  unexpected_error: {
    title: "You’ve already submitted a review for this business.",
    message:
      "You can edit your existing review if you'd like to update your experience.",
  },

  invite_token_required: {
    title: "Invalid invite link",
    message:
      "Open your review link from the invitation email, or ask the business to send a new invite.",
  },

  invalid_invite: {
    title: "This invite isn’t valid",
    message:
      "The link may be wrong or for a different business. Use the link from your invitation email.",
  },

  invite_used: {
    title: "This invite was already used",
    message: "You’ve already submitted a review from this invitation.",
  },

  invite_expired: {
    title: "This invite has expired",
    message: "Ask the business for a new review invitation.",
  },
};

