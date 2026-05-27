/**
 * Google OAuth from /write-review/item, read in /auth/callback to redirect back
 * to the item review page (separate from main /write-review flow).
 */
export const WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY = "write_review_item_google_mode";

/** localStorage JSON: item review payload before Google OAuth (mirrors GOOGLE_REVIEW_CONTEXT shape). */
export const GOOGLE_REVIEW_ITEM_CONTEXT_KEY = "GOOGLE_REVIEW_ITEM_CONTEXT";
