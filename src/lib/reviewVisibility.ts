/** Supabase PostgREST `.or()` filter: public reads exclude moderated hidden reviews. */
export const REVIEWS_PUBLIC_VISIBILITY_OR =
  "visibility.is.null,visibility.eq.visible" as const;

/** Matches category RPC / profile: include legacy rows with null status. */
export const REVIEWS_PUBLIC_STATUS_OR = "status.is.null,status.eq.published" as const;

/**
 * One PostgREST `or` group: (status is public) AND (visibility is public).
 * Prefer `get_public_review_aggregates` in the browser when available; this is the table-query fallback.
 */
export const REVIEWS_PUBLIC_STATUS_AND_VISIBILITY_OR =
  "and(status.is.null,visibility.is.null),and(status.is.null,visibility.eq.visible),and(status.eq.published,visibility.is.null),and(status.eq.published,visibility.eq.visible)" as const;

/** When a feed view still returns hidden rows (legacy DB), drop them client-side. */
export function isReviewVisibleForPublicFeed(row: Record<string, unknown>): boolean {
  const v = row.visibility;
  if (v == null || v === "") return true;
  return String(v).trim().toLowerCase() === "visible";
}
