import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchAndApplyLiveReviewMetrics,
  fetchCategoryCount,
  fetchCategoryRowsWithFallback,
  type CategoryBusinessRow,
} from "@/lib/categoryListingQueries";

const PAGE_SIZE = 10;

export type CategoryListingPagePayload = {
  rows: CategoryBusinessRow[];
  totalCount: number;
  hasNext: boolean;
  error: string | null;
};

async function loadCategoryListingPageUncached(
  categorySlug: string,
  countryCode: string,
  page: number,
  minRatingRpc: number | null,
): Promise<CategoryListingPagePayload> {
  const supabase = createSupabaseServerClient();
  const offset = page * PAGE_SIZE;
  const minForRpc = minRatingRpc ?? 0;
  const result = await fetchCategoryRowsWithFallback(
    supabase,
    categorySlug,
    countryCode,
    minForRpc,
    PAGE_SIZE + 1,
    offset,
  );

  if (result.error && result.rows.length === 0) {
    return {
      rows: [],
      totalCount: 0,
      hasNext: false,
      error: result.error,
    };
  }

  const list = result.rows;
  const hasNext = list.length > PAGE_SIZE;
  const sliced = hasNext ? list.slice(0, PAGE_SIZE) : list;
  const rowsCopy = sliced.map((r) => ({ ...r }));
  await fetchAndApplyLiveReviewMetrics(supabase, rowsCopy);
  const realCount = await fetchCategoryCount(
    supabase,
    categorySlug,
    countryCode,
  );

  return {
    rows: rowsCopy,
    totalCount:
      typeof realCount === "number"
        ? realCount
        : offset + rowsCopy.length + (hasNext ? 1 : 0),
    hasNext,
    error: result.error,
  };
}

/**
 * Cached slice for category “Top rated” (large candidate window, offset 0).
 */
async function loadCategoryTopCandidatesUncached(
  categorySlug: string,
  countryCode: string,
  minRatingRpc: number | null,
  candidateLimit: number,
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  const supabase = createSupabaseServerClient();
  const minForRpc = minRatingRpc ?? 0;
  const result = await fetchCategoryRowsWithFallback(
    supabase,
    categorySlug,
    countryCode,
    minForRpc,
    candidateLimit,
    0,
  );
  if (result.error && result.rows.length === 0) {
    return { rows: [], error: result.error };
  }
  const list = result.rows.map((r) => ({ ...r }));
  await fetchAndApplyLiveReviewMetrics(supabase, list);
  return { rows: list, error: result.error };
}

/** Server-side category listing (SSR + `/api/category-listings`). */
export function getCachedCategoryListingPage(
  categorySlug: string,
  countryCode: string,
  page: number,
  minRatingRpc: number | null,
): Promise<CategoryListingPagePayload> {
  return loadCategoryListingPageUncached(
    categorySlug,
    countryCode,
    page,
    minRatingRpc,
  );
}

export function getCachedCategoryTopCandidates(
  categorySlug: string,
  countryCode: string,
  minRatingRpc: number | null,
  candidateLimit: number,
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  return loadCategoryTopCandidatesUncached(
    categorySlug,
    countryCode,
    minRatingRpc,
    candidateLimit,
  );
}
