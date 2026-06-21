import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllBlogPosts } from "../../../data/blogPosts";
import { getTellacityArticleTopic } from "@/lib/articles/articleCategories";
import { tellacityArticleHasHtmlBody } from "@/lib/articles/tellacityArticles";
import { slugifyPlatformArticleTitle } from "./types";

export type SyncCatalogResult = {
  inserted: number;
  skipped: number;
  errors: string[];
};

function publishedAtFromDate(date: string): string {
  const trimmed = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T12:00:00.000Z`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}

/**
 * Import Tellacity catalog posts from `data/blogPosts.ts` into `platform_articles`.
 * Inserts missing slugs only, does not overwrite articles already in the CMS.
 */
export async function syncTellacityCatalogToPlatformArticles(
  admin: SupabaseClient,
): Promise<SyncCatalogResult> {
  const posts = getAllBlogPosts();
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  const { data: existingRows, error: listErr } = await admin
    .from("platform_articles")
    .select("slug")
    .limit(5000);

  if (listErr) {
    return { inserted: 0, skipped: 0, errors: [listErr.message] };
  }

  const existingSlugs = new Set(
    (existingRows ?? []).map((row) =>
      String((row as { slug?: string }).slug ?? "").trim().toLowerCase(),
    ),
  );

  for (const post of posts) {
    const topic = getTellacityArticleTopic(post.slug);
    if (!topic) {
      skipped += 1;
      continue;
    }

    const slug = (post.slug.trim() || slugifyPlatformArticleTitle(post.title)).toLowerCase();
    if (!slug) {
      skipped += 1;
      continue;
    }

    if (existingSlugs.has(slug)) {
      skipped += 1;
      continue;
    }

    const { error } = await admin.from("platform_articles").insert({
      slug,
      title: post.title.trim(),
      excerpt: post.description.trim() || null,
      body_html: post.content ?? "",
      topic,
      featured_image_url: post.thumbnail?.trim() || null,
      meta_title: null,
      meta_description: post.description.trim() || null,
      status: "published",
      published_at: publishedAtFromDate(post.date),
      author_user_id: null,
    });

    if (error) {
      // Another sync (or a prior import) may have inserted the same slug first.
      if (error.code === "23505") {
        existingSlugs.add(slug);
        skipped += 1;
        continue;
      }
      errors.push(`${slug}: ${error.message}`);
      continue;
    }

    existingSlugs.add(slug);
    inserted += 1;
  }

  return { inserted, skipped, errors };
}

export { tellacityArticleHasHtmlBody };
