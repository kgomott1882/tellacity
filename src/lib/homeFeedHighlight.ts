const REVIEW_ID_KEY = "tellacity_home_feed_highlight_review_id";
const NEWEST_KEY = "tellacity_home_feed_highlight_newest";

export function primeHomeFeedHighlightReviewId(reviewId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(REVIEW_ID_KEY, reviewId);
    sessionStorage.removeItem(NEWEST_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function primeHomeFeedHighlightNewest() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(NEWEST_KEY, "1");
    sessionStorage.removeItem(REVIEW_ID_KEY);
  } catch {
    /* ignore */
  }
}

export type HomeFeedHighlightHint =
  | { type: "review"; id: string }
  | { type: "newest" };

export function readHomeFeedHighlight(): HomeFeedHighlightHint | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(REVIEW_ID_KEY);
    if (id && id.trim()) {
      return { type: "review", id: id.trim() };
    }
    if (sessionStorage.getItem(NEWEST_KEY) === "1") {
      return { type: "newest" };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearHomeFeedHighlight() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REVIEW_ID_KEY);
    sessionStorage.removeItem(NEWEST_KEY);
  } catch {
    /* ignore */
  }
}
