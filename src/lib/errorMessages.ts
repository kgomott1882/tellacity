export const reviewErrorMessages: Record<
  string,
  { title: string; message: string }
> = {
  duplicate_review: {
    title: "You’ve already reviewed this business",
    message:
      "Each customer can leave one review per business. If your experience has changed, you can update your existing review.",
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
    title: "Something went wrong",
    message:
      "We couldn't submit your review right now. Please try again in a moment.",
  },
};

