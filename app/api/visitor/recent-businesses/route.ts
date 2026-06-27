export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

/** Accept a buffer of slugs so we can still return 4 unique businesses after alias dedupe. */
const MAX_SLUG_INPUT = 12;
const MAX_BUSINESSES = 4;

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  trust_score: number | null;
  average_rating: number | null;
  review_count: number;
  city: string | null;
  country_code: string | null;
};

function snapshotFromBusinessRow(row: Record<string, unknown>): {
  trust: number;
  count: number;
} {
  const trust =
    Number((row as { trust_score?: number | null }).trust_score ?? 0) ||
    Number((row as { average_rating?: number | null }).average_rating ?? 0) ||
    0;
  const count = Number((row as { review_count?: number | null }).review_count ?? 0) || 0;
  return { trust, count };
}

function mapBusinessRow(row: Record<string, unknown>): BusinessRow {
  const canonical = String((row as { canonical_slug?: string }).canonical_slug ?? "")
    .trim()
    .toLowerCase();
  const slug = String((row as { slug?: string }).slug ?? "").trim().toLowerCase();
  const snap = snapshotFromBusinessRow(row);

  return {
    id: String((row as { id?: string }).id ?? ""),
    name: String((row as { name?: string }).name ?? "").trim(),
    slug: canonical || slug,
    logo_url: (row as { logo_url?: string | null }).logo_url ?? null,
    website: (row as { website?: string | null }).website ?? null,
    trust_score: snap.trust > 0 ? snap.trust : null,
    average_rating: snap.trust > 0 ? snap.trust : null,
    review_count: snap.count,
    city: (row as { city?: string | null }).city ?? null,
    country_code: (row as { country_code?: string | null }).country_code ?? null,
  };
}

async function applyLiveReviewMetrics(
  db: SupabaseClient,
  businesses: BusinessRow[],
): Promise<BusinessRow[]> {
  const ids = businesses.map((b) => b.id).filter(Boolean);
  if (ids.length === 0) return businesses;

  const snapshots = new Map(
    businesses.map((b) => [b.id, { trust: b.trust_score ?? 0, count: b.review_count }]),
  );

  const agg = new Map<string, { count: number; avg: number }>();

  const { data: aggRpc, error: aggErr } = await db.rpc("get_public_review_aggregates", {
    p_business_ids: ids,
  } as never);

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
        agg.set(id, { count, avg });
      }
    }
  }

  return businesses.map((business) => {
    const live = agg.get(business.id);
    const snap = snapshots.get(business.id);
    const count = live?.count ?? snap?.count ?? 0;
    const rating = live?.avg ?? (count > 0 ? snap?.trust ?? 0 : 0);

    return {
      ...business,
      trust_score: count > 0 && rating > 0 ? rating : null,
      average_rating: count > 0 && rating > 0 ? rating : null,
      review_count: count,
    };
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("slugs")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ businesses: [] });
  }

  const slugs: string[] = [];
  const seenSlug = new Set<string>();
  for (const part of raw.split(",")) {
    const s = part.trim().toLowerCase();
    if (!s || seenSlug.has(s)) continue;
    seenSlug.add(s);
    slugs.push(s);
    if (slugs.length >= MAX_SLUG_INPUT) break;
  }

  if (slugs.length === 0) {
    return NextResponse.json({ businesses: [] });
  }

  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const db = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await db
      .from("businesses")
      .select(
        "id, name, slug, canonical_slug, logo_url, website, trust_score, average_rating, review_count, city, country_code",
      )
      .eq("status", "active")
      .or(
        slugs.map((s) => `slug.eq.${s}`).join(",") +
          "," +
          slugs.map((s) => `canonical_slug.eq.${s}`).join(","),
      );

    if (error) {
      console.error("[visitor/recent-businesses]", error.message);
      return NextResponse.json({ error: "Could not load businesses." }, { status: 500 });
    }

    const bySlug = new Map<string, Record<string, unknown>>();
    for (const row of data ?? []) {
      const slug = String((row as { slug?: string }).slug ?? "")
        .trim()
        .toLowerCase();
      const canonical = String((row as { canonical_slug?: string }).canonical_slug ?? "")
        .trim()
        .toLowerCase();
      if (slug) bySlug.set(slug, row as Record<string, unknown>);
      if (canonical) bySlug.set(canonical, row as Record<string, unknown>);
    }

    const seenBusinessIds = new Set<string>();
    const businesses: BusinessRow[] = [];
    for (const slug of slugs) {
      if (businesses.length >= MAX_BUSINESSES) break;
      const row = bySlug.get(slug);
      if (!row) continue;
      const mapped = mapBusinessRow(row);
      if (!mapped.id || seenBusinessIds.has(mapped.id)) continue;
      seenBusinessIds.add(mapped.id);
      businesses.push(mapped);
    }

    const withLiveMetrics = await applyLiveReviewMetrics(db, businesses);

    return NextResponse.json(
      { businesses: withLiveMetrics },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    console.error("[visitor/recent-businesses] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
