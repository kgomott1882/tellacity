import type { SupabaseClient } from "@supabase/supabase-js";

import {
  HOME_ROTATING_BEST_IN_SLUGS,
  type HomeBestInBusiness,
  normalizeHomeBestInBusiness,
} from "@/lib/homeBestInBundle";
import { normalizeBusinessIdKey } from "@/lib/normalizeBusinessId";
import { normalizeCountryCode } from "@/lib/country";
import {
  categorySlugAliasesForFallback,
  countryCodesForHomeQueries,
} from "@/lib/categoryListingQueries";

type CandidateRow = {
  id: string;
  name: string | null;
  slug: string | null;
  website: string | null;
  website_display: string | null;
  trust_score: number | null;
  review_count: number | null;
  logo_url: string | null;
  category_slug: string | null;
  secondary_category_slugs: string[] | null;
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
 * Fast candidate query against `businesses` directly via PostgREST.
 *
 * We deliberately bypass `get_top_businesses_for_category_global` here because
 * it joins `business_review_metrics_v` (live aggregate of *all* reviews) on
 * every call, which routinely hits the Supabase statement_timeout on the
 * homepage and made "Best in <category>" carousels return empty. PostgREST
 * scans only the `businesses` table, already indexed on
 * (`category_slug`, `country_code`, `status`), and is consistently fast.
 *
 * To compensate for any drift in the cached `businesses.trust_score` /
 * `review_count` columns (a business with new reviews but a stale cached
 * trust_score = 0 might sort low here), we:
 *   1. Pull a larger candidate pool (40 instead of 20)
 *   2. Order by stored `trust_score` desc nulls last, then `review_count`
 *      desc nulls last, then `name` asc, so brand-new businesses with
 *      cached zeros still appear *after* well-rated ones but are still in
 *      the candidate set when the pool is big enough.
 *   3. Re-rank the candidates using live aggregates from
 *      `get_public_review_aggregates` before slicing to top 8 in the caller.
 */
async function fetchCandidatesForSlug(
  supabase: SupabaseClient,
  slug: string,
  countryCode: string | null,
  candidateLimit: number,
): Promise<CandidateRow[]> {
  const aliases = categorySlugAliasesForFallback(slug);
  if (aliases.length === 0) return [];

  // PostgREST `or` filter: category_slug.in.(...) OR any secondary slug match.
  // Join with commas inside .or(), so we get a single combined OR clause.
  const orParts: string[] = [`category_slug.in.(${aliases.join(",")})`];
  for (const a of aliases) {
    orParts.push(`secondary_category_slugs.cs.{${a}}`);
  }
  const orClause = orParts.join(",");

  let query = supabase
    .from("businesses")
    .select(
      "id,name,slug,website,website_display,trust_score,review_count,logo_url,category_slug,secondary_category_slugs",
    )
    .eq("status", "active")
    .or(orClause)
    .order("trust_score", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true })
    .limit(candidateLimit);

  if (countryCode) {
    const countries = countryCodesForHomeQueries(countryCode);
    query = query.in("country_code", countries);
  }

  const { data, error } = await query;
  if (error) {
    console.warn(
      "[loadHomeBestInLive] PostgREST candidate query:",
      slug,
      countryCode ?? "(global)",
      error.message,
    );
    return [];
  }

  return (data ?? []) as CandidateRow[];
}

/**
 * Homepage "Best in …", fast path.
 *
 * Strategy:
 *   1. For each rotating category slug, fetch up to N candidates from the
 *      `businesses` table directly (filtered by category aliases + country),
 *      sorted by stored metrics for a "good enough" first pass.
 *   2. Bulk fetch live published-review aggregates for *all* candidate IDs in
 *      one batched RPC (`get_public_review_aggregates`).
 *   3. Re-rank per slug with live numbers (so stale cached `trust_score` on
 *      `businesses` cannot starve newly-reviewed businesses out of the top 8).
 *   4. If a slug has zero country-specific candidates, fall back to a global
 *      candidate fetch so the carousel never renders as "No businesses found".
 *
 * Previously this used `get_top_businesses_for_category_global`, which joins
 * `business_review_metrics_v` and frequently hit the Supabase statement
 * timeout, see dev logs:
 *   `[loadHomeBestInLive] get_top_businesses_for_category_global: insurance
 *    canceling statement due to statement timeout`.
 * The user reported the symptom as "Best in Insurance not loading"; switching
 * to the PostgREST candidate path resolves that.
 */
export async function loadHomeBestInLive(
  supabase: SupabaseClient,
  country: string,
  slugs: readonly string[] = HOME_ROTATING_BEST_IN_SLUGS,
  finalLimit = 8,
  candidatePool = 40,
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
  const candidateLimit = Math.max(finalLimit, Math.min(candidatePool, 80));

  // Phase 1: country-specific candidates, all slugs in parallel.
  const slugResults = await Promise.all(
    slugList.map(async (slug) => ({
      slug,
      rows: await fetchCandidatesForSlug(supabase, slug, norm, candidateLimit),
    })),
  );

  // Phase 1b: for any slug with zero country results, fall back to global so
  // the carousel is never empty (user explicitly asked for sections to
  // "ALWAYS load", see screenshot of "Best in Insurance, No businesses
  // found yet" on /?country=GB).
  const emptySlugs = slugResults
    .filter(({ rows }) => !rows || rows.length === 0)
    .map(({ slug }) => slug);

  const globalBySlug = new Map<string, CandidateRow[]>();
  if (emptySlugs.length > 0) {
    const globalResults = await Promise.all(
      emptySlugs.map(async (slug) => ({
        slug,
        rows: await fetchCandidatesForSlug(supabase, slug, null, candidateLimit),
      })),
    );
    for (const { slug, rows } of globalResults) {
      globalBySlug.set(slug, rows);
    }
  }

  const picksBySlug: Record<string, CandidateRow[]> = {};
  const allIds: string[] = [];
  for (const { slug, rows } of slugResults) {
    const effective =
      rows && rows.length > 0 ? rows : globalBySlug.get(slug) ?? [];
    picksBySlug[slug] = effective;
    for (const r of effective) {
      if (r.id) allIds.push(r.id);
    }
  }

  // Phase 2: live aggregates for all candidates in one batched call.
  const aggMap = await fetchPublicReviewAggregatesBatch(supabase, allIds);

  // Phase 3: re-rank per slug with live numbers (same tie-breakers as the
  // category directory page).
  for (const slug of slugList) {
    const rows = picksBySlug[slug] ?? [];
    if (rows.length === 0) continue;

    const scored = rows.map((r) => {
      const id = normalizeBusinessIdKey(r.id);
      const live = aggMap.get(id);
      // If a candidate has no live aggregates, fall back to stored cached
      // metrics so we don't drop businesses entirely when the live agg call
      // omits them (e.g. all reviews currently `landing_hidden`).
      const trust = live ? live.trust : Number(r.trust_score ?? 0) || 0;
      const count = live ? live.count : Number(r.review_count ?? 0) || 0;
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
          website: r.website_display ?? r.website,
          trust_score: trust,
          review_count: count,
          logo_url: r.logo_url,
          resolved_logo_url: r.logo_url,
        }),
      )
      .filter((x): x is HomeBestInBusiness => x != null);
  }

  return result;
}
