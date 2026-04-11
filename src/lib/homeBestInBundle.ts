import type { SupabaseClient } from "@supabase/supabase-js";

/** Same rotating slugs as the homepage hero; keep in sync with `app/page.tsx` UI. */
export const HOME_ROTATING_BEST_IN_SLUGS = [
  "banking",
  "insurance",
  "restaurants-and-bars",
  "internet-and-software",
  "banking-and-money",
  "cars-and-trucks",
] as const;

export type HomeBestInBusiness = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  website_display?: string | null;
  trust_score: number;
  review_count: number;
  logo_url: string | null;
  resolved_logo_url: string | null;
};

const COUNTRY_ALIAS_MAP: Record<string, string[]> = {
  US: ["US", "USA"],
  GB: ["GB", "UK", "GBR"],
  CA: ["CA", "CAN"],
  ZA: ["ZA", "ZAF"],
  AU: ["AU", "AUS"],
  NZ: ["NZ", "NZL"],
  IE: ["IE", "IRL"],
};

function countryAliases(code: string): string[] {
  const normalized = String(code ?? "").trim().toUpperCase();
  return COUNTRY_ALIAS_MAP[normalized] ?? [normalized];
}

type AggregateRow = {
  business_id: string;
  review_count: number | null;
  average_rating: number | null;
};

function sortBestInRows(rows: HomeBestInBusiness[]): HomeBestInBusiness[] {
  return [...rows].sort((a, b) => {
    const aCount = Number(a.review_count ?? 0) || 0;
    const bCount = Number(b.review_count ?? 0) || 0;
    const aZero = aCount === 0 ? 1 : 0;
    const bZero = bCount === 0 ? 1 : 0;
    if (aZero !== bZero) return aZero - bZero;
    const aScore = Number(a.trust_score ?? 0) || 0;
    const bScore = Number(b.trust_score ?? 0) || 0;
    if (bScore !== aScore) return bScore - aScore;
    if (bCount !== aCount) return bCount - aCount;
    return (a.name || "").localeCompare(b.name || "");
  });
}

function reviewedOnly(rows: HomeBestInBusiness[]): HomeBestInBusiness[] {
  return rows.filter((r) => (Number(r.review_count ?? 0) || 0) > 0);
}

async function loadPublicReviewAggregates(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Record<string, { review_count: number; trust_score: number }>> {
  const out: Record<string, { review_count: number; trust_score: number }> = {};
  if (ids.length === 0) return out;
  const { data, error } = await supabase.rpc("get_public_review_aggregates", {
    p_business_ids: ids,
  } as never);
  if (error || !data) return out;
  for (const row of data as AggregateRow[]) {
    if (!row.business_id) continue;
    out[row.business_id] = {
      review_count: Number(row.review_count ?? 0) || 0,
      trust_score: Number(row.average_rating ?? 0) || 0,
    };
  }
  return out;
}

async function loadBestInFallbackForSlug(
  supabase: SupabaseClient,
  slug: string,
  country: string,
  limit: number,
): Promise<HomeBestInBusiness[]> {
  const categories =
    slug === "banking" ? ["banking", "banking-and-money"] : [slug];
  const countries = countryAliases(country);

  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, website, website_display, logo_url, trust_score, review_count, category_slug, country_code, status",
    )
    .in("category_slug", categories)
    .in("country_code", countries)
    .eq("status", "active")
    .order("trust_score", { ascending: false })
    .order("review_count", { ascending: false })
    .order("name", { ascending: true })
    .limit(Math.max(limit * 4, 96));

  if (error || !data || data.length === 0) {
    return [];
  }

  const ids = data
    .map((r) => String((r as { id?: unknown }).id ?? "").trim())
    .filter(Boolean);
  const aggregateMap = await loadPublicReviewAggregates(supabase, ids);

  const mapped = data.map((r) => {
    const row = r as Record<string, unknown>;
    const id = String(row.id ?? "");
    const agg = aggregateMap[id];
    const trustScore =
      agg?.trust_score ??
      (typeof row.trust_score === "number" ? row.trust_score : 0) ??
      0;
    const reviewCount =
      agg?.review_count ??
      (typeof row.review_count === "number" ? row.review_count : 0) ??
      0;
    const logo =
      typeof row.logo_url === "string" && row.logo_url.trim() !== ""
        ? row.logo_url
        : null;
    return {
      id,
      name: String(row.name ?? ""),
      slug: String(row.slug ?? ""),
      website: typeof row.website === "string" ? row.website : null,
      website_display:
        typeof row.website_display === "string" ? row.website_display : null,
      trust_score: Number(trustScore) || 0,
      review_count: Number(reviewCount) || 0,
      logo_url: logo,
      resolved_logo_url: logo,
    } as HomeBestInBusiness;
  });

  return sortBestInRows(reviewedOnly(mapped)).slice(0, 8);
}

/**
 * RPC `get_top_businesses_for_category_global` exposes logo as `resolved_logo_url` (from `b.logo_url`).
 * Match `/api/home-feed` behaviour so cards always get a usable image field.
 */
export function mapRpcRowToHomeBestIn(
  row: Record<string, unknown>,
): HomeBestInBusiness {
  const logoRaw =
    (typeof row.logo_url === "string" &&
      row.logo_url.trim() !== "" &&
      row.logo_url) ||
    (typeof row.resolved_logo_url === "string" &&
      row.resolved_logo_url.trim() !== "" &&
      row.resolved_logo_url) ||
    null;

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    website: typeof row.website === "string" ? row.website : null,
    website_display:
      typeof row.website_display === "string" ? row.website_display : null,
    trust_score:
      Number(row.trust_score ?? row.average_rating ?? row.avg_rating ?? 0) ||
      0,
    review_count: Number(row.review_count ?? 0) || 0,
    logo_url: logoRaw,
    resolved_logo_url: logoRaw,
  };
}

export async function loadHomeBestInByCategory(
  supabase: SupabaseClient,
  country: string,
  options?: { perCategoryLimit?: number },
): Promise<{
  byCategory: Record<string, HomeBestInBusiness[]>;
  rpcErrors: Record<string, string | null>;
}> {
  const limit = options?.perCategoryLimit ?? 24;
  const slugs = [...HOME_ROTATING_BEST_IN_SLUGS];

  const results = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const { data, error } = await supabase.rpc(
          "get_top_businesses_for_category_global",
          {
            p_category_slug: slug,
            p_country_code: country,
            p_min_rating: null,
            p_limit: limit,
            p_offset: 0,
          } as never,
        );
        return {
          slug,
          rows: (Array.isArray(data) ? data : []) as Record<string, unknown>[],
          error: error?.message ?? null,
        };
      } catch (e) {
        return {
          slug,
          rows: [] as Record<string, unknown>[],
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );

  const byCategory: Record<string, HomeBestInBusiness[]> = {};
  const rpcErrors: Record<string, string | null> = {};

  for (const item of results) {
    const rpcRows = item.rows.map(mapRpcRowToHomeBestIn);
    const rpcIds = rpcRows.map((r) => r.id).filter(Boolean);
    const rpcAgg = await loadPublicReviewAggregates(supabase, rpcIds);
    const rpcEnriched = rpcRows.map((r) => {
      const agg = rpcAgg[r.id];
      if (!agg) return r;
      return {
        ...r,
        review_count: Number(agg.review_count ?? 0) || 0,
        trust_score: Number(agg.trust_score ?? 0) || 0,
      };
    });
    const rankedRpc = sortBestInRows(reviewedOnly(rpcEnriched)).slice(0, 8);
    const needsFallback = item.error != null || rankedRpc.length === 0;
    const fallbackRows = needsFallback
      ? await loadBestInFallbackForSlug(supabase, item.slug, country, limit)
      : [];
    byCategory[item.slug] =
      fallbackRows.length > 0 ? fallbackRows : rankedRpc;
    rpcErrors[item.slug] = item.error;
  }

  const bankingRows = byCategory["banking"];
  const bankingMoneyRows = byCategory["banking-and-money"];
  if (
    Array.isArray(bankingRows) &&
    bankingRows.length === 0 &&
    Array.isArray(bankingMoneyRows) &&
    bankingMoneyRows.length > 0
  ) {
    byCategory["banking"] = [...bankingMoneyRows];
  }

  return { byCategory, rpcErrors };
}
