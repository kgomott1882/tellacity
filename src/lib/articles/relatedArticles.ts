import type { SupabaseClient } from "@supabase/supabase-js";

export type RelatedArticleCard = {
  id: string;
  title: string;
  slug: string;
  featured_image_url: string | null;
  published_at: string | null;
  business_name: string | null;
};

const MIN_RELATED = 3;
const MAX_RELATED = 6;

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  featured_image_url: string | null;
  published_at: string | null;
  businesses?: { name?: string | null; status?: string | null } | { name?: string | null; status?: string | null }[] | null;
};

function normalizeBusiness(
  raw: ArticleRow["businesses"],
): { name: string | null; status: string | null } | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;
  return {
    name: row.name ?? null,
    status: row.status ?? null,
  };
}

function mapRow(row: ArticleRow): RelatedArticleCard | null {
  const biz = normalizeBusiness(row.businesses);
  if (biz && biz.status && biz.status !== "active") return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    featured_image_url: row.featured_image_url,
    published_at: row.published_at,
    business_name: biz?.name ?? null,
  };
}

async function queryArticles(
  supabase: SupabaseClient,
  options: {
    excludeIds: Set<string>;
    businessIds?: string[];
    limit: number;
  },
): Promise<RelatedArticleCard[]> {
  if (options.limit <= 0) return [];

  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, featured_image_url, published_at, businesses(name, status)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(options.limit + options.excludeIds.size);

  if (options.businessIds?.length) {
    query = query.in("business_id", options.businessIds);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const results: RelatedArticleCard[] = [];
  for (const row of data as ArticleRow[]) {
    if (options.excludeIds.has(row.id)) continue;
    const mapped = mapRow(row);
    if (!mapped) continue;
    results.push(mapped);
    if (results.length >= options.limit) break;
  }
  return results;
}

async function fetchActiveBusinessIdsByCategory(
  supabase: SupabaseClient,
  categorySlug: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("category_slug", categorySlug)
    .eq("status", "active")
    .limit(100);

  if (error || !data) return [];
  return data.map((row) => String((row as { id: string }).id));
}

/**
 * Related articles for public article pages.
 * Priority: same business → same category → recent published.
 */
export async function fetchRelatedArticles(
  supabase: SupabaseClient,
  params: {
    articleId: string;
    businessId: string;
    categorySlug: string | null;
  },
): Promise<RelatedArticleCard[]> {
  const excludeIds = new Set<string>([params.articleId]);
  const collected: RelatedArticleCard[] = [];

  const sameBusiness = await queryArticles(supabase, {
    excludeIds,
    businessIds: [params.businessId],
    limit: MAX_RELATED,
  });
  for (const item of sameBusiness) {
    excludeIds.add(item.id);
    collected.push(item);
  }

  if (collected.length < MIN_RELATED && params.categorySlug) {
    const categoryBusinessIds = await fetchActiveBusinessIdsByCategory(
      supabase,
      params.categorySlug,
    );
    const filteredIds = categoryBusinessIds.filter((id) => id !== params.businessId);
    if (filteredIds.length > 0) {
      const sameCategory = await queryArticles(supabase, {
        excludeIds,
        businessIds: filteredIds,
        limit: MAX_RELATED - collected.length,
      });
      for (const item of sameCategory) {
        excludeIds.add(item.id);
        collected.push(item);
      }
    }
  }

  if (collected.length < MIN_RELATED) {
    const recent = await queryArticles(supabase, {
      excludeIds,
      limit: MAX_RELATED - collected.length,
    });
    collected.push(...recent);
  }

  return collected.slice(0, MAX_RELATED);
}
