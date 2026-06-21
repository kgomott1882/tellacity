import type { SupabaseClient } from "@supabase/supabase-js";

/** Same columns as BusinessClient review list / load-more queries. */
export const BUSINESS_PROFILE_REVIEW_SELECT =
  "id, guest_name, rating, title, body, created_at, status, like_count, product_photo_id, owner_response, owner_response_at";

/** Client pagination batch size (`.range(offset, offset + size - 1)`). */
export const BUSINESS_PROFILE_REVIEWS_CLIENT_PAGE_SIZE = 5;

/** SSR seed for `/b/[slug]` — review bodies in initial HTML. */
export const BUSINESS_PROFILE_REVIEWS_SSR_LIMIT = 12;

/** Nested Review entries in profile JSON-LD (subset of visible list). */
export const BUSINESS_PROFILE_REVIEWS_JSON_LD_LIMIT = 3;

/** Matches aggregate + visible list visibility (excludes legacy `null`). */
export const BUSINESS_PROFILE_REVIEW_VISIBILITY = [
  "visible",
  "landing_hidden",
] as const;

export const BUSINESS_PROFILE_REVIEW_STATUS = "published" as const;

export type BusinessProfileReview = {
  id: string;
  reviewerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  createdAtRaw: string | null;
  likeCount: number;
  productName: string | null;
  ownerResponse: string | null;
  ownerResponseAt: string | null;
};

export function formatBusinessProfileReviewDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type ReviewRow = Record<string, unknown>;

/** Ordered public profile review list query (visible page + JSON-LD source). */
export function businessProfileReviewsQuery(
  db: SupabaseClient,
  businessId: string,
) {
  return db
    .from("reviews")
    .select(BUSINESS_PROFILE_REVIEW_SELECT, { count: "exact" })
    .eq("business_id", businessId)
    .eq("status", BUSINESS_PROFILE_REVIEW_STATUS)
    .in("visibility", [...BUSINESS_PROFILE_REVIEW_VISIBILITY])
    .order("created_at", { ascending: false });
}

export async function mapBusinessProfileReviewRows(
  db: SupabaseClient,
  rows: ReviewRow[],
): Promise<BusinessProfileReview[]> {
  const photoIds = [
    ...new Set(
      rows
        .map((r) => r.product_photo_id as string | null | undefined)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const nameByPhoto = new Map<string, string>();
  if (photoIds.length > 0) {
    const { data: photos } = await db
      .from("business_photos")
      .select("id, product_name")
      .in("id", photoIds);
    for (const p of photos ?? []) {
      const id = String((p as { id?: string }).id ?? "");
      const nm = String(
        (p as { product_name?: string | null }).product_name ?? "",
      ).trim();
      if (id && nm) nameByPhoto.set(id, nm);
    }
  }

  return rows.map((review) => {
    const pid = review.product_photo_id as string | null | undefined;
    const productName = pid ? (nameByPhoto.get(pid) ?? null) : null;
    return {
      id: String(review.id),
      reviewerName: String(review.guest_name ?? "Anonymous"),
      rating: Number(review.rating ?? 0),
      title: String(review.title ?? ""),
      body: String(review.body ?? ""),
      createdAt: formatBusinessProfileReviewDate(
        review.created_at as string | null | undefined,
      ),
      createdAtRaw: (review.created_at as string | null | undefined) ?? null,
      likeCount: Number((review as { like_count?: number }).like_count ?? 0),
      productName,
      ownerResponse:
        String(
          (review as { owner_response?: string | null }).owner_response ?? "",
        ).trim() || null,
      ownerResponseAt: formatBusinessProfileReviewDate(
        (review as { owner_response_at?: string | null }).owner_response_at,
      ),
    };
  });
}

export async function fetchBusinessProfileReviewsPage(
  db: SupabaseClient,
  businessId: string,
  offset: number,
  limit: number,
): Promise<{ reviews: BusinessProfileReview[]; totalCount: number }> {
  const safeLimit = Math.max(1, Math.floor(limit));
  const safeOffset = Math.max(0, Math.floor(offset));
  const { data, error, count } = await businessProfileReviewsQuery(
    db,
    businessId,
  ).range(safeOffset, safeOffset + safeLimit - 1);

  if (error) {
    throw error;
  }

  const mapped = await mapBusinessProfileReviewRows(db, (data ?? []) as ReviewRow[]);
  return {
    reviews: mapped,
    totalCount: count ?? mapped.length,
  };
}
