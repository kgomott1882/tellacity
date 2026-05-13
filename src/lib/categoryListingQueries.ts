import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeTagsForDisplay } from "@/lib/businessTags";
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
  /** Optional: only present when DB exposes it; otherwise derive from address/city/country. */
  display_location?: string | null;
  logo_url?: string | null;
  resolved_logo_url?: string | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  tags?: string[] | null;
  secondary_category_slugs?: string[] | null;
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

/** ISO + common aliases for `businesses.country_code` (home + category fallbacks). */
export function countryCodesForHomeQueries(code: string): string[] {
  return countryAliases(code);
}

/** Same slugs as `expand_catalog_category_slug_aliases` in Postgres (fallback path only). */
export function categorySlugAliasesForFallback(slug: string): string[] {
  const s = slug.trim().toLowerCase();
  if (!s) return [];
  if (s === "banking" || s === "banking-and-money") {
    return ["banking", "banking-and-money"];
  }
  if (s === "internet-and-software") {
    return ["internet-and-software", "it-and-communication"];
  }
  if (s === "insurance") {
    return [
      "insurance",
      "insurance-agency",
      "insurance-broker",
      "insurance-company",
      "life-insurance",
      "car-insurance",
      "home-insurance",
      "health-insurance",
      "travel-insurance",
      "pet-insurance",
      "business-insurance",
    ];
  }
  return [s];
}

export function buildCategoryDirectoryBusinessesMatchOr(categorySlug: string): string {
  const slugs = categorySlugAliasesForFallback(categorySlug);
  if (slugs.length === 0) {
    return pgQuotedEq("category_slug", "__invalid__");
  }
  const parts: string[] = [`category_slug.in.(${slugs.join(",")})`];
  for (const s of slugs) {
    parts.push(`secondary_category_slugs.cs.{${s}}`);
  }
  return parts.join(",");
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
    const rows = (rpc.data ?? []) as CategoryBusinessRow[];
    for (const row of rows) {
      row.tags = mergeTagsForDisplay(
        row.tags,
        row.secondary_category_slugs,
        row.category_slug,
      );
    }
    return { rows, error: null };
  }

  const categories = categorySlugAliasesForFallback(categorySlug);
  const countries = countryAliases(countryCode);

  const direct = await supabase
    .from("businesses")
    .select(
      "id,name,slug,website,website_display,trust_score,review_count,category_slug,country_code,address,city,logo_url,status,tags,secondary_category_slugs",
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
  for (const row of rows) {
    row.tags = mergeTagsForDisplay(
      row.tags,
      row.secondary_category_slugs,
      row.category_slug,
    );
  }
  // RPC can hit statement_timeout while the direct slice still succeeds; do not
  // surface that to users when we have rows to show.
  return {
    rows,
    error: rows.length > 0 ? null : rpc.error.message ?? null,
  };
}

const TAG_LISTING_SELECT =
  "id,name,slug,website,website_display,trust_score,review_count,category_slug,country_code,address,city,logo_url,status,tags,secondary_category_slugs";

/**
 * Businesses whose primary category, tags array, or secondary slugs match the
 * given tag slug (hyphenated, lowercased in URLs). Uses the same PostgREST
 * `cs` (contains) semantics as array membership for text[] columns.
 */
export async function fetchTagListingRows(
  supabase: SupabaseClient,
  tagSlug: string,
  countryCode: string,
  minRating: number | null,
  limit: number,
  offset: number,
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  const tag = tagSlug.trim().toLowerCase();
  if (!tag) {
    return { rows: [], error: null };
  }
  const countries = countryAliases(countryCode);

  const { data, error } = await supabase
    .from("businesses")
    .select(TAG_LISTING_SELECT)
    .eq("status", "active")
    .in("country_code", countries)
    .or(
      `tags.cs.{${tag}},secondary_category_slugs.cs.{${tag}},category_slug.eq.${tag}`,
    )
    .order("trust_score", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false })
    .order("name", { ascending: true })
    .range(offset, Math.max(offset + limit - 1, offset));

  if (error) {
    return { rows: [], error: error.message ?? "Failed to load tag listings." };
  }

  let rows = (data ?? []) as CategoryBusinessRow[];
  if (typeof minRating === "number") {
    rows = rows.filter((r) => (Number(r.trust_score ?? 0) || 0) >= minRating);
  }
  for (const row of rows) {
    row.tags = mergeTagsForDisplay(
      row.tags,
      row.secondary_category_slugs,
      row.category_slug,
    );
  }
  return { rows, error: null };
}

export async function fetchTagListingCount(
  supabase: SupabaseClient,
  tagSlug: string,
  countryCode: string,
): Promise<number | null> {
  const tag = tagSlug.trim().toLowerCase();
  if (!tag) return 0;
  const countries = countryAliases(countryCode);

  const { count, error } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .in("country_code", countries)
    .or(
      `tags.cs.{${tag}},secondary_category_slugs.cs.{${tag}},category_slug.eq.${tag}`,
    );

  if (error) return null;
  return count ?? 0;
}

export async function fetchCategoryCount(
  supabase: SupabaseClient,
  categorySlug: string,
  countryCode: string,
): Promise<number | null> {
  const categories = categorySlugAliasesForFallback(categorySlug);
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
  options?: { preserveOrder?: boolean },
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

    if (!options?.preserveOrder) {
      rows.sort((a, b) => {
        const aRating = mergedRating(a.id);
        const bRating = mergedRating(b.id);
        const aCt = mergedCount(a.id);
        const bCt = mergedCount(b.id);
        if (bRating !== aRating) return bRating - aRating;
        if (bCt !== aCt) return bCt - aCt;
        return (a.name || "").localeCompare(b.name || "");
      });
    }

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

const RECENTLY_REVIEWED_RPC = "get_recently_reviewed_businesses_for_category" as const;

function mapRecentlyReviewedRpcRow(row: Record<string, unknown>): CategoryBusinessRow {
  const tagsVal = row.tags;
  const sec = row.secondary_category_slugs;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    website: row.website != null ? String(row.website) : null,
    trust_score: row.trust_score != null ? Number(row.trust_score) : null,
    average_rating: row.average_rating != null ? Number(row.average_rating) : null,
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    review_count: Number(row.review_count ?? 0) || 0,
    category_slug: row.category_slug != null ? String(row.category_slug) : null,
    country_code: row.country_code != null ? String(row.country_code) : null,
    address: row.address != null ? String(row.address) : null,
    city: row.city != null ? String(row.city) : null,
    display_location:
      row.display_location != null ? String(row.display_location) : null,
    resolved_logo_url:
      row.resolved_logo_url != null ? String(row.resolved_logo_url) : null,
    logo_url: row.resolved_logo_url != null ? String(row.resolved_logo_url) : null,
    tags: Array.isArray(tagsVal)
      ? (tagsVal as unknown[]).map((x) => String(x))
      : null,
    secondary_category_slugs: Array.isArray(sec)
      ? (sec as string[])
      : null,
  };
}

/** PostgREST `eq` value with hyphens must be quoted. */
function pgQuotedEq(column: string, slug: string): string {
  const safe = String(slug ?? "").replace(/"/g, "");
  return `${column}.eq."${safe}"`;
}

/**
 * Same semantics as `get_recently_reviewed_businesses_for_category` (no recency window):
 * order businesses by time of latest public review in this directory slice.
 */
async function fetchRecentlyReviewedViaReviewsJoin(
  supabase: SupabaseClient,
  categorySlug: string,
  countryCode: string,
  limit: number,
  listingKind: "category" | "tag",
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  const cleaned = categorySlug.trim().toLowerCase();
  if (!cleaned) return { rows: [], error: null };

  const cc = normalizeCountryCode(countryCode);
  const countries = countryAliases(cc);
  const lim = Math.max(1, Math.min(12, limit));

  const businessSelect =
    "id,name,slug,website,website_display,trust_score,review_count,category_slug,country_code,address,city,logo_url,status,tags,secondary_category_slugs";

  const businessesMatchOr =
    listingKind === "tag"
      ? `tags.cs.{${cleaned}},secondary_category_slugs.cs.{${cleaned}},${pgQuotedEq(
          "category_slug",
          cleaned,
        )}`
      : buildCategoryDirectoryBusinessesMatchOr(cleaned);

  const scanLimit = Math.min(600, Math.max(lim * 40, 80));

  const { data, error } = await supabase
    .from("reviews")
    .select(`created_at,business_id,businesses!inner(${businessSelect})`)
    .eq("businesses.status", "active")
    .in("businesses.country_code", countries)
    .or(businessesMatchOr, { foreignTable: "businesses" })
    .or(REVIEWS_PUBLIC_STATUS_AND_VISIBILITY_OR)
    .order("created_at", { ascending: false })
    .limit(scanLimit);

  if (error) {
    return { rows: [], error: error.message };
  }

  const rowsOut: CategoryBusinessRow[] = [];
  const seen = new Set<string>();

  for (const row of data ?? []) {
    const r = row as {
      businesses?:
        | Record<string, unknown>
        | Record<string, unknown>[]
        | null;
    };
    const b = Array.isArray(r.businesses) ? r.businesses[0] : r.businesses;
    if (!b || typeof b !== "object") continue;

    const id = String((b as { id?: string }).id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const websiteDisplay =
      (b as { website_display?: string }).website_display != null
        ? String((b as { website_display?: string }).website_display)
        : null;
    const websiteRaw =
      (b as { website?: string }).website != null
        ? String((b as { website?: string }).website)
        : null;
    const website =
      (websiteDisplay && websiteDisplay.trim()) ||
      (websiteRaw && websiteRaw.trim()) ||
      null;

    const city = (b as { city?: string }).city != null ? String((b as { city?: string }).city) : "";
    const addr =
      (b as { address?: string }).address != null
        ? String((b as { address?: string }).address)
        : "";
    const ccRow =
      (b as { country_code?: string }).country_code != null
        ? String((b as { country_code?: string }).country_code)
        : "";
    const display_location =
      [city, ccRow].filter((x) => (x ?? "").trim().length > 0).join(", ").trim() ||
      null;

    const logoRaw =
      (b as { logo_url?: string }).logo_url != null
        ? String((b as { logo_url?: string }).logo_url)
        : null;

    const tagsVal = (b as { tags?: unknown }).tags;
    const sec = (b as { secondary_category_slugs?: unknown }).secondary_category_slugs;

    rowsOut.push({
      id,
      name: String((b as { name?: string }).name ?? ""),
      slug: String((b as { slug?: string }).slug ?? ""),
      website,
      trust_score:
        (b as { trust_score?: unknown }).trust_score != null
          ? Number((b as { trust_score?: unknown }).trust_score)
          : null,
      average_rating:
        (b as { trust_score?: unknown }).trust_score != null
          ? Number((b as { trust_score?: unknown }).trust_score)
          : null,
      avg_rating:
        (b as { trust_score?: unknown }).trust_score != null
          ? Number((b as { trust_score?: unknown }).trust_score)
          : null,
      review_count: Number((b as { review_count?: unknown }).review_count ?? 0) || 0,
      category_slug:
        (b as { category_slug?: string }).category_slug != null
          ? String((b as { category_slug?: string }).category_slug)
          : null,
      country_code:
        (b as { country_code?: string }).country_code != null
          ? String((b as { country_code?: string }).country_code)
          : null,
      address: addr || null,
      city: city || null,
      display_location,
      resolved_logo_url: logoRaw,
      logo_url: logoRaw,
      tags: Array.isArray(tagsVal)
        ? (tagsVal as unknown[]).map((x) => String(x))
        : null,
      secondary_category_slugs: Array.isArray(sec)
        ? (sec as string[])
        : null,
    });

    if (rowsOut.length >= lim) break;
  }

  for (const row of rowsOut) {
    row.tags = mergeTagsForDisplay(
      row.tags,
      row.secondary_category_slugs,
      row.category_slug,
    );
  }

  return { rows: rowsOut, error: null };
}

/**
 * Category / tag directory: businesses in this slug + country ordered by time of
 * their latest *published* public review. No time cutoff — reviews may be months old.
 *
 * Uses RPC when available (category pages); falls back to the same logic via PostgREST
 * if the RPC is missing or returns nothing. Tag directories use the join path so `tags[]`
 * matches the listing.
 */
export async function fetchRecentlyReviewedForCategory(
  supabase: SupabaseClient,
  categorySlug: string,
  countryCode: string,
  limit: number,
  listingKind: "category" | "tag" = "category",
): Promise<{ rows: CategoryBusinessRow[]; error: string | null }> {
  const cleaned = (categorySlug ?? "").trim();
  if (!cleaned) return { rows: [], error: null };

  const cc = normalizeCountryCode(countryCode);
  const lim = Math.max(1, Math.min(12, limit));

  if (listingKind === "tag") {
    return fetchRecentlyReviewedViaReviewsJoin(
      supabase,
      cleaned,
      cc,
      lim,
      "tag",
    );
  }

  const { data, error } = await supabase.rpc(RECENTLY_REVIEWED_RPC, {
    p_category_slug: cleaned,
    p_country_code: cc,
    p_limit: lim,
  });

  const raw = (data ?? []) as Array<Record<string, unknown>>;
  let rows: CategoryBusinessRow[] =
    !error && raw.length > 0 ? raw.map((row) => mapRecentlyReviewedRpcRow(row)) : [];

  if (rows.length > 0) {
    for (const row of rows) {
      row.tags = mergeTagsForDisplay(
        row.tags,
        row.secondary_category_slugs,
        row.category_slug,
      );
    }
    return { rows, error: null };
  }

  const fallback = await fetchRecentlyReviewedViaReviewsJoin(
    supabase,
    cleaned,
    cc,
    lim,
    "category",
  );
  if (fallback.rows.length > 0) {
    return { rows: fallback.rows, error: null };
  }
  return {
    rows: [],
    error: fallback.error ?? (error ? error.message : null),
  };
}
