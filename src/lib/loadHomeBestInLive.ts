import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildCategoryDirectoryBusinessesMatchOr,
  categorySlugAliasesForFallback,
  countryCodesForHomeQueries,
} from "@/lib/categoryListingQueries";
import {
  HOME_ROTATING_BEST_IN_SLUGS,
  type HomeBestInBusiness,
  normalizeHomeBestInBusiness,
} from "@/lib/homeBestInBundle";
import { normalizeBusinessIdKey } from "@/lib/normalizeBusinessId";
import { normalizeCountryCode } from "@/lib/country";

type BusinessPickRow = {
  id: string;
  name: string | null;
  slug: string | null;
  website: string | null;
  website_display: string | null;
  logo_url: string | null;
  trust_score: number | null;
  review_count: number | null;
};

const AGG_CHUNK = 80;

async function fetchPublicReviewAggregatesBatch(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, { trust: number; count: number }>> {
  const out = new Map<string, { trust: number; count: number }>();
  const unique = [...new Set(ids.map((id) => normalizeBusinessIdKey(id)).filter(Boolean))];
  for (let i = 0; i < unique.length; i += AGG_CHUNK) {
    const chunk = unique.slice(i, i + AGG_CHUNK);
    const { data, error } = await supabase.rpc("get_public_review_aggregates", {
      p_business_ids: chunk,
    } as never);
    if (error) {
      console.warn("[loadHomeBestInLive] get_public_review_aggregates:", error.message);
      continue;
    }
    for (const row of (data ?? []) as {
      business_id?: string;
      average_rating?: number | null;
      review_count?: number | null;
    }[]) {
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

function websiteFromPick(r: BusinessPickRow): string | null {
  const d = r.website_display?.trim();
  if (d) return d;
  const w = r.website?.trim();
  return w || null;
}

/**
 * Homepage "Best in …" — avoids `get_home_best_in_bundle` (often hits Supabase
 * statement timeouts on large `businesses`). Uses indexed PostgREST filters +
 * alias expansion (same as category directory), then live scores from
 * `get_public_review_aggregates`.
 */
export async function loadHomeBestInLive(
  supabase: SupabaseClient,
  country: string,
  slugs: readonly string[] = HOME_ROTATING_BEST_IN_SLUGS,
  finalLimit = 8,
  candidatePool = 24,
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

  const countries = countryCodesForHomeQueries(normalizeCountryCode(country));

  const picksBySlug: Record<string, BusinessPickRow[]> = {};
  const allIds: string[] = [];

  for (const slug of slugList) {
    const aliases = categorySlugAliasesForFallback(slug);
    if (aliases.length === 0) continue;

    const orFilter = buildCategoryDirectoryBusinessesMatchOr(slug);
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id,name,slug,website,website_display,logo_url,trust_score,review_count",
      )
      .eq("status", "active")
      .in("country_code", countries)
      .or(orFilter)
      .order("trust_score", { ascending: false, nullsFirst: false })
      .order("review_count", { ascending: false, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(Math.max(1, Math.min(candidatePool, 48)));

    if (error) {
      console.warn("[loadHomeBestInLive] businesses query:", slug, error.message);
      picksBySlug[slug] = [];
      continue;
    }

    const rows = (data ?? []) as BusinessPickRow[];
    picksBySlug[slug] = rows;
    for (const r of rows) {
      if (r.id) allIds.push(r.id);
    }
  }

  const aggMap = await fetchPublicReviewAggregatesBatch(supabase, allIds);

  for (const slug of slugList) {
    const rows = picksBySlug[slug] ?? [];
    const scored = rows.map((r) => {
      const id = normalizeBusinessIdKey(r.id);
      const agg = aggMap.get(id);
      const trust = agg?.trust ?? (Number(r.trust_score ?? 0) || 0);
      const count = agg?.count ?? (Number(r.review_count ?? 0) || 0);
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
          website: websiteFromPick(r),
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
