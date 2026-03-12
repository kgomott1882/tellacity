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
};

