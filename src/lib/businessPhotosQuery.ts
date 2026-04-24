/**
 * Canonical PostgREST ordering for `business_photos` lists.
 * Grouping helpers in `businessPhotosDisplay` preserve within-section order from the array
 * (iterate rows in this order when building buckets).
 */
export type BusinessPhotosOrderableQuery = {
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean; referencedTable?: string }
  ) => BusinessPhotosOrderableQuery;
};

export function applyBusinessPhotosOrdering<T extends BusinessPhotosOrderableQuery>(query: T): T {
  return query
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false }) as T;
}
