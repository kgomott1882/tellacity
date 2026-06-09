import type { SupabaseClient } from "@supabase/supabase-js";
import type { TellacityArticle } from "@/lib/articles/tellacityArticles";
import {
  getTellacityArticleTopic,
  type ArticleTopic,
} from "@/lib/articles/articleCategories";
import type { PlatformArticleRow } from "./types";
import { normalizePlatformArticleTopic } from "./types";

export function platformRowToTellacityArticle(
  row: PlatformArticleRow,
): TellacityArticle {
  const slug = row.slug.trim().toLowerCase();
  const topic = normalizePlatformArticleTopic(row.topic) as ArticleTopic;
  const dateSource = row.published_at ?? row.updated_at ?? row.created_at;
  const date = dateSource
    ? new Date(dateSource).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    slug,
    title: row.title,
    description: row.excerpt?.trim() || row.meta_description?.trim() || row.title,
    date,
    thumbnail: row.featured_image_url ?? undefined,
    category: topic,
    content: row.body_html ?? "",
    topic,
    hasLegacyPage: false,
  };
}

export async function fetchPublishedPlatformArticles(
  supabase: SupabaseClient,
): Promise<TellacityArticle[]> {
  const { data, error } = await supabase
    .from("platform_articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return (data as PlatformArticleRow[]).map(platformRowToTellacityArticle);
}

export async function fetchPublishedPlatformArticleBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<TellacityArticle | null> {
  const normalized = slug.trim().toLowerCase();
  const { data, error } = await supabase
    .from("platform_articles")
    .select("*")
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return platformRowToTellacityArticle(data as PlatformArticleRow);
}

/** DB topic must map to hub filter categories when possible. */
export function platformTopicForSlug(slug: string): ArticleTopic | null {
  return getTellacityArticleTopic(slug);
}
