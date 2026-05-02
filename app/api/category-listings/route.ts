import { NextResponse } from "next/server";
import { normalizeCountryCode } from "@/lib/country";
import {
  getCachedCategoryListingPage,
  getCachedCategoryTopCandidates,
  getCachedTagListingPage,
  getCachedTagTopCandidates,
} from "@/lib/cachedCategoryListing";

const CACHE_HEADER =
  "public, s-maxage=120, stale-while-revalidate=300, max-age=0";

const SLUG_RE = /^[a-z0-9-]{1,120}$/;

function parseMinRatingRpc(raw: string | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

/**
 * Cached category business listings (same query stack as category pages + homepage Best-in RPC).
 * Query: slug, country, page (0-based), minRating (optional), mode=page|top.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
    const country = normalizeCountryCode(url.searchParams.get("country"));
    const kind = (url.searchParams.get("kind") ?? "category").trim().toLowerCase();
    const mode = (url.searchParams.get("mode") ?? "page").trim().toLowerCase();
    const minParsed = parseMinRatingRpc(url.searchParams.get("minRating"));
    const minRpc = minParsed ?? 0;

    if (!slug || !SLUG_RE.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug", rows: [], totalCount: 0, hasNext: false },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (mode === "top") {
      const lim = Math.min(
        80,
        Math.max(
          1,
          parseInt(String(url.searchParams.get("candidateLimit") ?? "40"), 10) ||
            40,
        ),
      );
      const { rows, error } =
        kind === "tag"
          ? await getCachedTagTopCandidates(slug, country, minRpc, lim)
          : await getCachedCategoryTopCandidates(slug, country, minRpc, lim);
      return NextResponse.json(
        { mode: "top", kind, rows, error },
        { headers: { "Cache-Control": CACHE_HEADER } },
      );
    }

    const page = Math.max(
      0,
      parseInt(String(url.searchParams.get("page") ?? "0"), 10) || 0,
    );
    const includeCountRaw = (
      url.searchParams.get("includeCount") ?? "1"
    ).trim().toLowerCase();
    const includeTotalCount =
      includeCountRaw !== "0" &&
      includeCountRaw !== "false" &&
      includeCountRaw !== "no";

    const payload =
      kind === "tag"
        ? await getCachedTagListingPage(slug, country, page, minRpc, {
            includeTotalCount,
          })
        : await getCachedCategoryListingPage(slug, country, page, minRpc, {
            includeTotalCount,
          });

    return NextResponse.json(
      { mode: "page", kind, ...payload },
      { headers: { "Cache-Control": CACHE_HEADER } },
    );
  } catch (e) {
    console.error("[category-listings]", e);
    return NextResponse.json(
      {
        error: "Failed to load category listings",
        rows: [],
        totalCount: 0,
        hasNext: false,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
