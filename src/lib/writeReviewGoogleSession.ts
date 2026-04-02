/**
 * Set before Google OAuth from Write a review; read in /auth/callback to redirect
 * without putting ?next= in redirectTo (matches Supabase redirect allowlist patterns).
 */
export const WRITE_REVIEW_GOOGLE_MODE_SESSION_KEY = "write_review_google_mode";
