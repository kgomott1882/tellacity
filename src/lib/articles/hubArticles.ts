import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type ArticleFilterCategory,
  type ArticleHubTypeFilter,
  type ArticleTopic,
  getTellacityArticleTopic,
} from "./articleCategories";
import { getAllTellacityArticles, type TellacityArticle } from "./tellacityArticles";
import type { PlatformArticleRow } from "@/lib/platformArticles/types";
import { normalizePlatformArticleTopic } from "@/lib/platformArticles/types";

export const ARTICLES_HUB_PAGE_SIZE = 12;
export const ARTICLES_HUB_URL = "https://tellacity.com/articles";

export type HubArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImageUrl: string | null;
  publishedAt: string;
  contentType: "tellacity" | "business" | "case_study";
  category: string | null;
  publisherName: string;
  publisherHref: string | null;
};

type DbArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  content_type: string;
  businesses?: unknown;
};

function mapTellacityToHubCard(post: TellacityArticle): HubArticleCard {
  const publishedAt = /^\d{4}-\d{2}-\d{2}$/.test(post.date.trim())
    ? `${post.date.trim()}T12:00:00.000Z`
    : post.date;
  return {
    id: `tellacity:${post.slug}`,
    slug: post.slug,
    title: post.title,
    excerpt: post.description,
    featuredImageUrl: post.thumbnail ?? null,
    publishedAt,
    contentType: "tellacity",
    category: post.topic,
    publisherName: "Tellacity",
    publisherHref: "/about",
  };
}

function mapDbRowToHubCard(row: DbArticleRow): HubArticleCard | null {
  const bizRaw = row.businesses;
  const biz = (Array.isArray(bizRaw) ? bizRaw[0] : bizRaw) as {
    name: string | null;
    slug: string | null;
    canonical_slug?: string | null;
    category_slug: string | null;
    status?: string | null;
  } | null;

  if (!biz?.name) return null;
  const bizStatus = String(biz.status ?? "active").trim().toLowerCase();
  if (bizStatus !== "active") return null;

  const profileSlug = String(biz.canonical_slug ?? biz.slug ?? "").trim();
  const contentType = row.content_type === "case_study" ? "case_study" : "business";

  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    featuredImageUrl: row.featured_image_url,
    publishedAt: row.published_at ?? new Date(0).toISOString(),
    contentType,
    category: biz.category_slug,
    publisherName: biz.name,
    publisherHref: profileSlug ? `/b/${encodeURIComponent(profileSlug)}` : null,
  };
}

function filterTellacityArticles(
  posts: TellacityArticle[],
  typeFilter: ArticleHubTypeFilter,
  categoryFilter: ArticleFilterCategory,
): TellacityArticle[] {
  if (typeFilter === "business" || typeFilter === "case_study") return [];

  let filtered = posts;
  if (categoryFilter !== "All") {
    filtered = filtered.filter((post) => post.topic === categoryFilter);
  }
  return filtered;
}

function mapPlatformRowToHubCard(row: PlatformArticleRow): HubArticleCard {
  const topic = normalizePlatformArticleTopic(row.topic);
  return {
    id: `platform:${row.id}`,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    featuredImageUrl: row.featured_image_url,
    publishedAt: row.published_at ?? row.updated_at ?? row.created_at,
    contentType: "tellacity",
    category: topic,
    publisherName: "Tellacity",
    publisherHref: "/about",
  };
}

async function fetchPlatformHubArticles(
  supabase: SupabaseClient,
  typeFilter: ArticleHubTypeFilter,
  categoryFilter: ArticleFilterCategory,
): Promise<HubArticleCard[]> {
  if (typeFilter === "business" || typeFilter === "case_study") return [];

  const { data, error } = await supabase
    .from("platform_articles")
    .select(
      "id, slug, title, excerpt, featured_image_url, published_at, updated_at, created_at, topic, status",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];

  let rows = data as PlatformArticleRow[];
  if (categoryFilter !== "All") {
    rows = rows.filter(
      (row) => normalizePlatformArticleTopic(row.topic) === categoryFilter,
    );
  }

  return rows.map(mapPlatformRowToHubCard);
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
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => String((row as { id: string }).id));
}

async function fetchBusinessHubArticles(
  supabase: SupabaseClient,
  typeFilter: ArticleHubTypeFilter,
  categoryFilter: ArticleFilterCategory,
  businessCategorySlug?: string | null,
): Promise<HubArticleCard[]> {
  if (typeFilter === "tellacity") return [];
  if (categoryFilter !== "All" && !businessCategorySlug) return [];

  const normalizedCategory = businessCategorySlug?.trim().toLowerCase() || null;
  let businessIds: string[] | undefined;
  if (normalizedCategory) {
    businessIds = await fetchActiveBusinessIdsByCategory(supabase, normalizedCategory);
    if (businessIds.length === 0) return [];
  }

  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image_url, published_at, content_type, businesses(name, slug, canonical_slug, category_slug, status)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (businessIds?.length) {
    query = query.in("business_id", businessIds);
  }

  if (typeFilter === "case_study") {
    query = query.eq("content_type", "case_study");
  } else if (typeFilter === "business") {
    query = query.eq("content_type", "article");
  }

  const { data } = await query;
  return (data ?? [])
    .map((row) => mapDbRowToHubCard(row as DbArticleRow))
    .filter((card): card is HubArticleCard => Boolean(card));
}

export type HubArticlesResult = {
  items: HubArticleCard[];
  totalCount: number;
  page: number;
  totalPages: number;
};

/** Homepage / discovery: newest published articles across Tellacity editorial + business. */
export type LatestArticle = HubArticleCard;

type LatestHubArticleRpcRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string;
  content_type: string;
  category: string | null;
  publisher_name: string;
  publisher_href: string | null;
};

function mapRpcRowToHubCard(row: LatestHubArticleRpcRow): HubArticleCard {
  const contentType =
    row.content_type === "case_study"
      ? "case_study"
      : row.content_type === "business"
        ? "business"
        : "tellacity";

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    featuredImageUrl: row.featured_image_url,
    publishedAt: row.published_at,
    contentType,
    category: row.category,
    publisherName: row.publisher_name,
    publisherHref: row.publisher_href,
  };
}

async function fetchLatestHubArticlesRpc(
  supabase: SupabaseClient,
  limit: number,
): Promise<HubArticleCard[] | null> {
  const { data, error } = await supabase.rpc("get_latest_hub_articles", {
    p_limit: limit,
  });

  if (error) {
    console.error("get_latest_hub_articles RPC:", error.message);
    return null;
  }

  return ((data ?? []) as LatestHubArticleRpcRow[]).map(mapRpcRowToHubCard);
}

async function fetchLatestPlatformArticles(
  supabase: SupabaseClient,
  limit: number,
): Promise<HubArticleCard[]> {
  const { data, error } = await supabase
    .from("platform_articles")
    .select(
      "id, slug, title, excerpt, featured_image_url, published_at, updated_at, created_at, topic, status",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("fetchLatestPlatformArticles:", error.message);
    return [];
  }
  if (!data) return [];
  return (data as PlatformArticleRow[]).map(mapPlatformRowToHubCard);
}

async function fetchLatestBusinessArticles(
  supabase: SupabaseClient,
  limit: number,
): Promise<HubArticleCard[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image_url, published_at, content_type, businesses(name, slug, canonical_slug, category_slug, status)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchLatestBusinessArticles:", error.message);
    return [];
  }
  if (!data) return [];

  return (data as DbArticleRow[])
    .map((row) => mapDbRowToHubCard(row))
    .filter((card): card is HubArticleCard => Boolean(card));
}

export async function getLatestArticles(
  supabase: SupabaseClient,
  limit = 4,
): Promise<LatestArticle[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20));

  const rpcCards = await fetchLatestHubArticlesRpc(supabase, safeLimit);
  if (rpcCards) {
    return rpcCards.slice(0, safeLimit);
  }

  /** Wide pool before merge so the true global top N is returned (RPC not deployed yet). */
  const dbFetchLimit = Math.max(safeLimit * 10, 40);
  const [platformDb, business] = await Promise.all([
    fetchLatestPlatformArticles(supabase, dbFetchLimit),
    fetchLatestBusinessArticles(supabase, dbFetchLimit),
  ]);

  return [...platformDb, ...business]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, safeLimit);
}

export async function fetchHubArticles(
  supabase: SupabaseClient,
  options: {
    typeFilter: ArticleHubTypeFilter;
    categoryFilter: ArticleFilterCategory;
    businessCategorySlug?: string | null;
    page: number;
  },
): Promise<HubArticlesResult> {
  const page = Math.max(1, options.page);
  const businessCategorySlug = options.businessCategorySlug?.trim().toLowerCase() || null;

  const platformDb = businessCategorySlug
    ? []
    : await fetchPlatformHubArticles(
        supabase,
        options.typeFilter,
        options.categoryFilter,
      );
  const platformSlugs = new Set(platformDb.map((card) => card.slug.toLowerCase()));

  const tellacityStatic = businessCategorySlug
    ? []
    : filterTellacityArticles(
        getAllTellacityArticles().filter((post) => !platformSlugs.has(post.slug.toLowerCase())),
        options.typeFilter,
        options.categoryFilter,
      ).map(mapTellacityToHubCard);

  const business = await fetchBusinessHubArticles(
    supabase,
    options.typeFilter,
    businessCategorySlug ? "All" : options.categoryFilter,
    businessCategorySlug,
  );

  const merged = [...platformDb, ...tellacityStatic, ...business].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  const totalCount = merged.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ARTICLES_HUB_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * ARTICLES_HUB_PAGE_SIZE;

  return {
    items: merged.slice(from, from + ARTICLES_HUB_PAGE_SIZE),
    totalCount,
    page: safePage,
    totalPages,
  };
}

export function buildArticlesHubQuery(params: {
  type?: ArticleHubTypeFilter;
  category?: ArticleFilterCategory;
  businessCategory?: string | null;
  page?: number;
}): string {
  const search = new URLSearchParams();
  if (params.type && params.type !== "all") search.set("type", params.type);
  if (params.category && params.category !== "All") {
    search.set("category", params.category);
  }
  const businessCategory = params.businessCategory?.trim().toLowerCase();
  if (businessCategory) {
    search.set("businessCategory", businessCategory);
  }
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const q = search.toString();
  return q ? `/articles?${q}` : "/articles";
}

/** Category-scoped business article discovery (public profile, internal linking). */
export function buildBusinessCategoryArticlesHref(categorySlug: string): string {
  return buildArticlesHubQuery({ businessCategory: categorySlug });
}

/** Topic label for legacy static article pages (category pill). */
export function tellacityTopicForSlug(slug: string): ArticleTopic | null {
  return getTellacityArticleTopic(slug);
}
