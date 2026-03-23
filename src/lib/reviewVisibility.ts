/** Supabase PostgREST `.or()` filter: public reads exclude moderated hidden reviews. */
export const REVIEWS_PUBLIC_VISIBILITY_OR =
  "visibility.is.null,visibility.eq.visible" as const;

/** When a feed view still returns hidden rows (legacy DB), drop them client-side. */
export function isReviewVisibleForPublicFeed(row: Record<string, unknown>): boolean {
  const v = row.visibility;
  if (v == null || v === "") return true;
  return String(v).trim().toLowerCase() === "visible";
}
