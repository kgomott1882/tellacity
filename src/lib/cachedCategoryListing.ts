import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchAndApplyLiveReviewMetrics,
  fetchCategoryCount,
  fetchCategoryRowsWithFallback,
  fetchTagListingCount,
  fetchTagListingRows,
  type CategoryBusinessRow,
} from "@/lib/categoryListingQueries";
import { CATEGORY_LISTING_PAGE_SIZE } from "@/lib/categoryListingPageSize";

const PAGE_SIZE = CATEGORY_LISTING_PAGE_SIZE;

export type CategoryListingPagePayload = {
  rows: CategoryBusinessRow[];
  /** `null` when `includeTotalCount` was false — client keeps prior total. */
  totalCount: number | null;
  hasNext: boolean;
  error: string | null;
};

async function loadCategoryListingPageUncached(
  categorySlug: string,
  countryCode: string,
  page: number,
  minRatingRpc: number | null,
  options?: { includeTotalCount?: boolean },
): Promise<CategoryListingPagePayload> {
  const includeTotalCount = options?.includeTotalCount !== false;
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

  if (includeTotalCount) {
    const [_, realCount] = await Promise.all([
      fetchAndApplyLiveReviewMetrics(supabase, rowsCopy),
      fetchCategoryCount(supabase, categorySlug, countryCode),
    ]);

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

  await fetchAndApplyLiveReviewMetrics(supabase, rowsCopy);

  return {
    rows: rowsCopy,
    totalCount: null,
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

async function loadTagListingPageUncached(
  tagSlug: string,
  countryCode: string,
  page: number,
  minRatingRpc: number | null,
  options?: { includeTotalCount?: boolean },
): Promise<CategoryListingPagePayload> {
  const includeTotalCount = options?.includeTotalCount !== false;
  const supabase = createSupabaseServerClient();
  const offset = page * PAGE_SIZE;
  const minForRpc = minRatingRpc ?? 0;
  const result = await fetchTagListingRows(
    supabase,
    tagSlug,
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

  if (includeTotalCount) {
    const [_, realCount] = await Promise.all([
      fetchAndApplyLiveReviewMetrics(supabase, rowsCopy),
      fetchTagListingCount(supabase, tagSlug, countryCode),
    ]);

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

  await fetchAndApplyLiveReviewMetrics(supabase, rowsCopy);

  return {
    rows: rowsCopy,
    totalCount: null,
    hasNext,
    error: result.error,
  };
}

async function loadTagTopCandidatesUncached(
  tagSlug: string,
  countryCode: string,
  minRatingRpc: number | null,
  candidateLimit: number,
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  const supabase = createSupabaseServerClient();
  const minForRpc = minRatingRpc ?? 0;
  const result = await fetchTagListingRows(
    supabase,
    tagSlug,
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
  options?: { includeTotalCount?: boolean },
): Promise<CategoryListingPagePayload> {
  return loadCategoryListingPageUncached(
    categorySlug,
    countryCode,
    page,
    minRatingRpc,
    options,
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

/** Server-side tag listing (SSR + `/api/category-listings?kind=tag`). */
export function getCachedTagListingPage(
  tagSlug: string,
  countryCode: string,
  page: number,
  minRatingRpc: number | null,
  options?: { includeTotalCount?: boolean },
): Promise<CategoryListingPagePayload> {
  return loadTagListingPageUncached(
    tagSlug,
    countryCode,
    page,
    minRatingRpc,
    options,
  );
}

export function getCachedTagTopCandidates(
  tagSlug: string,
  countryCode: string,
  minRatingRpc: number | null,
  candidateLimit: number,
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  return loadTagTopCandidatesUncached(
    tagSlug,
    countryCode,
    minRatingRpc,
    candidateLimit,
  );
}
