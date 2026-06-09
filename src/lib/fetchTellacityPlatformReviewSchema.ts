import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublishedVisibleReviewAggregates } from "@/lib/reviewAggregatesForBusiness";
import { REVIEWS_PUBLIC_VISIBILITY_OR } from "@/lib/reviewVisibility";
import {
  buildReviewSchemaFromRows,
  type ProductReviewSchema,
} from "@/lib/subscriptionOfferJsonLd";

const PLATFORM_REVIEW_SLUGS = ["tellacity", "tellacity-platform"] as const;

/**
 * When Tellacity has its own verified business profile with published reviews,
 * surface real aggregateRating/review data on pricing structured data.
 */
export async function fetchTellacityPlatformReviewSchema(
  supabase: SupabaseClient,
): Promise<ProductReviewSchema | null> {
  for (const slug of PLATFORM_REVIEW_SLUGS) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (!business?.id) continue;

    const businessId = String(business.id);
    const { reviewCount, averageRating } = await getPublishedVisibleReviewAggregates(
      supabase,
      businessId,
    );

    if (reviewCount <= 0 || averageRating <= 0) continue;

    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("rating, title, body, guest_name, created_at")
      .eq("business_id", businessId)
      .eq("status", "published")
      .or(REVIEWS_PUBLIC_VISIBILITY_OR)
      .order("created_at", { ascending: false })
      .limit(3);

    return buildReviewSchemaFromRows(
      averageRating,
      reviewCount,
      reviewRows ?? [],
    );
  }

  return null;
}
