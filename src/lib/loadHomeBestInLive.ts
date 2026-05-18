import type { SupabaseClient } from "@supabase/supabase-js";

import {
  HOME_ROTATING_BEST_IN_SLUGS,
  type HomeBestInBusiness,
  normalizeHomeBestInBusiness,
} from "@/lib/homeBestInBundle";
import { normalizeBusinessIdKey } from "@/lib/normalizeBusinessId";
import { normalizeCountryCode } from "@/lib/country";

type RpcRow = {
  id: string;
  name: string | null;
  slug: string | null;
  website: string | null;
  trust_score: number | null;
  review_count: number | null;
  resolved_logo_url: string | null;
};

const AGG_CHUNK = 80;

async function fetchPublicReviewAggregatesBatch(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, { trust: number; count: number }>> {
  const out = new Map<string, { trust: number; count: number }>();
  const unique = [...new Set(ids.map((id) => normalizeBusinessIdKey(id)).filter(Boolean))];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += AGG_CHUNK) {
    chunks.push(unique.slice(i, i + AGG_CHUNK));
  }

  // Run the aggregate RPC in parallel for each chunk (was sequential).
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await supabase.rpc(
        "get_public_review_aggregates",
        { p_business_ids: chunk } as never,
      );
      if (error) {
        console.warn(
          "[loadHomeBestInLive] get_public_review_aggregates:",
          error.message,
        );
        return [] as {
          business_id?: string;
          average_rating?: number | null;
          review_count?: number | null;
        }[];
      }
      return (data ?? []) as {
        business_id?: string;
        average_rating?: number | null;
        review_count?: number | null;
      }[];
    }),
  );

  for (const rows of results) {
    for (const row of rows) {
      const id = normalizeBusinessIdKey(row.business_id);
      if (!id) continue;
      out.set(id, {
        trust: Number(row.average_rating ?? 0) || 0,
        count: Number(row.review_count ?? 0) || 0,
      });
    }
  }
  return out;
}

/**
 * Homepage "Best in …" — uses the SAME RPC as the category directory
 * (`get_top_businesses_for_category_global`), so the home top-8 is always the
 * top-8 of the category first page. The previous PostgREST candidate query
 * ordered by the stored `businesses.trust_score` / `review_count` columns,
 * which are cached and can drift from the live `business_review_metrics_v`
 * view (e.g. Clearpay had 1 live review but stored trust_score = 0, so it
 * never entered the candidate pool and was missing from the carousel).
 *
 * The RPC already filters by `status = 'active'`, country aliases, slug
 * aliases (banking ↔ banking-and-money, internet-and-software ↔
 * it-and-communication, insurance variants) and live published+visible
 * aggregates from `business_review_metrics_v`. We then merge per-business
 * live aggregates from `get_public_review_aggregates` and re-sort with the
 * same tiebreakers as the category page.
 */
export async function loadHomeBestInLive(
  supabase: SupabaseClient,
  country: string,
  slugs: readonly string[] = HOME_ROTATING_BEST_IN_SLUGS,
  finalLimit = 8,
  candidatePool = 20,
): Promise<Record<string, HomeBestInBusiness[]>> {
  const result: Record<string, HomeBestInBusiness[]> = {};
  for (const slug of slugs) {
    result[String(slug).trim().toLowerCase()] = [];
  }

  const slugList = slugs
    .map((s) => String(s ?? "").trim().toLowerCase())
    .filter(Boolean);

  if (slugList.length === 0) {
    return result;
  }

  const norm = normalizeCountryCode(country);
  const rpcLimit = Math.max(finalLimit, Math.min(candidatePool, 40));

  /**
   * Run all per-slug RPC lookups in parallel — was a sequential `for` loop that
   * stacked round-trips and made homepage SSR 5–10s slower than necessary.
   * Each RPC is independent so Promise.all is safe.
   */
  const slugResults = await Promise.all(
    slugList.map(async (slug) => {
      const { data, error } = await supabase.rpc(
        "get_top_businesses_for_category_global",
        {
          p_category_slug: slug,
          p_country_code: norm,
          p_min_rating: null,
          p_limit: rpcLimit,
          p_offset: 0,
        } as never,
      );
      if (error) {
        console.warn(
          "[loadHomeBestInLive] get_top_businesses_for_category_global:",
          slug,
          error.message,
        );
        return { slug, rows: [] as RpcRow[] };
      }
      return { slug, rows: (data ?? []) as RpcRow[] };
    }),
  );

  const picksBySlug: Record<string, RpcRow[]> = {};
  const allIds: string[] = [];
  for (const { slug, rows } of slugResults) {
    picksBySlug[slug] = rows;
    for (const r of rows) {
      if (r.id) allIds.push(r.id);
    }
  }

  const aggMap = await fetchPublicReviewAggregatesBatch(supabase, allIds);

  for (const slug of slugList) {
    const rows = picksBySlug[slug] ?? [];
    // Same fallback as the category page: a business with no live
    // published+visible reviews ranks as 0 / 0 (we never trust the stored
    // `businesses.trust_score` / `review_count` columns here).
    const scored = rows.map((r) => {
      const id = normalizeBusinessIdKey(r.id);
      const agg = aggMap.get(id);
      const trust = agg ? agg.trust : 0;
      const count = agg ? agg.count : 0;
      return { r, trust, count };
    });

    scored.sort((a, b) => {
      if (b.trust !== a.trust) return b.trust - a.trust;
      if (b.count !== a.count) return b.count - a.count;
      return String(a.r.name ?? "").localeCompare(String(b.r.name ?? ""), undefined, {
        sensitivity: "base",
      });
    });

    const top = scored.slice(0, Math.max(1, Math.min(finalLimit, 20)));
    result[slug] = top
      .map(({ r, trust, count }) =>
        normalizeHomeBestInBusiness({
          id: r.id,
          name: r.name,
          slug: r.slug,
          website: r.website,
          trust_score: trust,
          review_count: count,
          logo_url: r.resolved_logo_url,
          resolved_logo_url: r.resolved_logo_url,
        }),
      )
      .filter((x): x is HomeBestInBusiness => x != null);
  }

  return result;
}
