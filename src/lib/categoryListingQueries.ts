import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeCountryCode } from "@/lib/country";
import {
  REVIEWS_PUBLIC_STATUS_AND_VISIBILITY_OR,
} from "@/lib/reviewVisibility";

export type CategoryBusinessRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  trust_score: number | null;
  review_count: number;
  category_slug: string | null;
  country_code: string | null;
  address: string | null;
  city: string | null;
  display_location: string | null;
  logo_url?: string | null;
  resolved_logo_url?: string | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  tags?: string[] | null;
};

const FALLBACK_COUNTRY_ALIASES: Record<string, string[]> = {
  US: ["US", "USA"],
  GB: ["GB", "UK", "GBR"],
  ZA: ["ZA", "ZAF"],
  AU: ["AU", "AUS"],
  CA: ["CA", "CAN"],
  NZ: ["NZ", "NZL"],
  IE: ["IE", "IRL"],
};

function countryAliases(code: string): string[] {
  const normalized = normalizeCountryCode(code).toUpperCase();
  return FALLBACK_COUNTRY_ALIASES[normalized] ?? [normalized];
}

function snapshotRpcRating(row: CategoryBusinessRow): {
  trust: number;
  count: number;
} {
  const trust =
    (Number(row.trust_score ?? 0) || 0) ||
    (Number(row.average_rating ?? 0) || 0) ||
    (Number(row.avg_rating ?? 0) || 0);
  return { trust, count: Number(row.review_count ?? 0) || 0 };
}

export async function fetchCategoryRowsWithFallback(
  supabase: SupabaseClient,
  categorySlug: string,
  countryCode: string,
  minRating: number | null,
  limit: number,
  offset: number,
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  const rpc = await supabase.rpc("get_top_businesses_for_category_global", {
    p_category_slug: categorySlug,
    p_country_code: countryCode,
    p_min_rating: minRating,
    p_limit: limit,
    p_offset: offset,
  });

  if (!rpc.error) {
    return { rows: (rpc.data ?? []) as CategoryBusinessRow[], error: null };
  }

  const categories =
    categorySlug === "banking"
      ? ["banking", "banking-and-money"]
      : [categorySlug];
  const countries = countryAliases(countryCode);

  const direct = await supabase
    .from("businesses")
    .select(
      "id,name,slug,website,website_display,trust_score,review_count,category_slug,country_code,address,city,display_location,logo_url,resolved_logo_url,status,tags",
    )
    .in("category_slug", categories)
    .in("country_code", countries)
    .eq("status", "active")
    .order("trust_score", { ascending: false })
    .order("review_count", { ascending: false })
    .order("name", { ascending: true })
    .range(offset, Math.max(offset + limit - 1, offset));

  if (direct.error) {
    return {
      rows: [],
      error:
        rpc.error.message ??
        direct.error.message ??
        "Failed to load businesses.",
    };
  }

  let rows = (direct.data ?? []) as CategoryBusinessRow[];
  if (typeof minRating === "number") {
    rows = rows.filter((r) => (Number(r.trust_score ?? 0) || 0) >= minRating);
  }
  return {
    rows,
    error: rpc.error.message ?? null,
  };
}

export async function fetchCategoryCount(
  supabase: SupabaseClient,
  categorySlug: string,
  countryCode: string,
): Promise<number | null> {
  const categories =
    categorySlug === "banking"
      ? ["banking", "banking-and-money"]
      : [categorySlug];
  const countries = countryAliases(countryCode);

  const query = supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .in("category_slug", categories)
    .in("country_code", countries)
    .eq("status", "active");

  const { count, error } = await query;
  if (error) return null;
  return count ?? 0;
}

/**
 * Merges visible published reviews into rows when the browser can read them.
 * If the direct `reviews` query returns nothing (RLS, filters), keeps RPC
 * `get_top_businesses_for_category_global` metrics — never overwrites with zeros.
 */
export async function fetchAndApplyLiveReviewMetrics(
  supabase: SupabaseClient,
  rows: CategoryBusinessRow[],
): Promise<void> {
  const ids = rows.map((row) => row.id).filter(Boolean);
  if (ids.length === 0) return;

  const rpcSnapshot = new Map<string, { trust: number; count: number }>();
  for (const row of rows) {
    if (!row.id) continue;
    rpcSnapshot.set(row.id, snapshotRpcRating(row));
  }

  const agg: Record<string, { count: number; sum: number }> = {};

  try {
    const { data: aggRpc, error: aggErr } = await supabase.rpc(
      "get_public_review_aggregates",
      { p_business_ids: ids },
    );

    if (!aggErr && Array.isArray(aggRpc)) {
      for (const row of aggRpc as {
        business_id?: string;
        review_count?: number | null;
        average_rating?: number | null;
      }[]) {
        const id = String(row.business_id ?? "");
        if (!id) continue;
        const count = Number(row.review_count ?? 0) || 0;
        const avg = Number(row.average_rating ?? 0) || 0;
        if (count > 0) {
          agg[id] = { count, sum: avg * count };
        }
      }
    } else {
      const { data: reviews, error: reviewError } = await supabase
        .from("reviews")
        .select("business_id, rating")
        .in("business_id", ids)
        .or(REVIEWS_PUBLIC_STATUS_AND_VISIBILITY_OR);

      if (reviewError || !reviews) return;

      for (const row of reviews as {
        business_id?: string;
        rating?: number;
      }[]) {
        const id = String(row.business_id);
        const rating = Number(row.rating ?? 0);
        if (!agg[id]) agg[id] = { count: 0, sum: 0 };
        if (rating > 0) {
          agg[id].count += 1;
          agg[id].sum += rating;
        }
      }
    }

    const mergedRating = (id: string) => {
      const m = agg[id];
      if (m && m.count > 0) return m.sum / m.count;
      return rpcSnapshot.get(id)?.trust ?? 0;
    };
    const mergedCount = (id: string) => {
      const m = agg[id];
      if (m && m.count > 0) return m.count;
      return rpcSnapshot.get(id)?.count ?? 0;
    };

    rows.sort((a, b) => {
      const aRating = mergedRating(a.id);
      const bRating = mergedRating(b.id);
      const aCt = mergedCount(a.id);
      const bCt = mergedCount(b.id);
      if (bRating !== aRating) return bRating - aRating;
      if (bCt !== aCt) return bCt - aCt;
      return (a.name || "").localeCompare(b.name || "");
    });

    rows.forEach((row) => {
      const m = agg[row.id];
      const snap = rpcSnapshot.get(row.id);
      if (m && m.count > 0) {
        row.trust_score = m.sum / m.count;
        row.review_count = m.count;
      } else if (snap) {
        row.trust_score = snap.trust;
        row.review_count = snap.count;
      }
    });
  } catch {
    // keep RPC metrics
  }
}
