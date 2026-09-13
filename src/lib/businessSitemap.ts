import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  BUSINESS_SITEMAP_PAGE_SIZE,
  isIndexableBusinessSlug,
} from "@/lib/businessIndexability";

export type SitemapBusinessUrl = {
  slug: string;
  updated_at: string | null;
};

function createAnonClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Count active businesses that pass the SEO quality gate (claimed / reviews /
 * long description). Falls back to a filtered head-count if RPC missing.
 */
export async function countSitemapEligibleBusinesses(
  client?: SupabaseClient,
): Promise<number> {
  const supabase = client ?? createAnonClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc("count_sitemap_eligible_businesses");
  if (!error && data != null) {
    const n = Number(data);
    return Number.isFinite(n) ? n : 0;
  }

  // Fallback without description-length SQL: claimed OR has reviews only
  // (under-counts description-only rows until migration is applied).
  const { count: claimed } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .not("owner_id", "is", null);
  const { count: reviewed } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .is("owner_id", null)
    .gt("review_count", 0);

  return (claimed ?? 0) + (reviewed ?? 0);
}

export async function listSitemapEligibleBusinessesPage(
  page: number,
  pageSize: number = BUSINESS_SITEMAP_PAGE_SIZE,
  client?: SupabaseClient,
): Promise<SitemapBusinessUrl[]> {
  const supabase = client ?? createAnonClient();
  if (!supabase) return [];

  const safePage = Math.max(1, page);
  const limit = Math.min(Math.max(pageSize, 1), 5000);
  const offset = (safePage - 1) * limit;

  const { data, error } = await supabase.rpc("list_sitemap_eligible_businesses", {
    p_offset: offset,
    p_limit: limit,
  });

  if (!error && Array.isArray(data)) {
    return (data as Array<{ slug?: string | null; updated_at?: string | null }>)
      .map((row) => {
        const slug = String(row.slug ?? "").trim().toLowerCase();
        if (!isIndexableBusinessSlug(slug)) return null;
        return {
          slug,
          updated_at: row.updated_at ?? null,
        };
      })
      .filter((row): row is SitemapBusinessUrl => Boolean(row));
  }

  // Fallback: page claimed + reviewed only (same under-count caveat).
  const from = offset;
  const to = offset + limit - 1;
  const { data: rows } = await supabase
    .from("businesses")
    .select("slug, updated_at, owner_id, review_count")
    .eq("status", "active")
    .or("owner_id.not.is.null,review_count.gt.0")
    .order("id", { ascending: true })
    .range(from, to);

  return (rows ?? [])
    .map((row) => {
      const slug = String((row as { slug?: string | null }).slug ?? "")
        .trim()
        .toLowerCase();
      if (!isIndexableBusinessSlug(slug)) return null;
      return {
        slug,
        updated_at:
          ((row as { updated_at?: string | null }).updated_at as string | null) ??
          null,
      };
    })
    .filter((row): row is SitemapBusinessUrl => Boolean(row));
}

export function businessSitemapShardCount(eligibleTotal: number): number {
  if (eligibleTotal <= 0) return 0;
  return Math.ceil(eligibleTotal / BUSINESS_SITEMAP_PAGE_SIZE);
}
