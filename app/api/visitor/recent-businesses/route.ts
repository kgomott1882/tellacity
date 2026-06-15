export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

const MAX_SLUGS = 8;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("slugs")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ businesses: [] });
  }

  const slugs = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_SLUGS);

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

    const businesses = slugs
      .map((slug) => bySlug.get(slug))
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map((row) => {
        const canonical = String((row as { canonical_slug?: string }).canonical_slug ?? "")
          .trim()
          .toLowerCase();
        const slug = String((row as { slug?: string }).slug ?? "").trim().toLowerCase();
        return {
          id: String((row as { id?: string }).id ?? ""),
          name: String((row as { name?: string }).name ?? "").trim(),
          slug: canonical || slug,
          logo_url: (row as { logo_url?: string | null }).logo_url ?? null,
          website: (row as { website?: string | null }).website ?? null,
          trust_score: (row as { trust_score?: number | null }).trust_score ?? null,
          average_rating: (row as { average_rating?: number | null }).average_rating ?? null,
          review_count: (row as { review_count?: number | null }).review_count ?? 0,
          city: (row as { city?: string | null }).city ?? null,
          country_code: (row as { country_code?: string | null }).country_code ?? null,
        };
      });

    return NextResponse.json(
      { businesses },
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
