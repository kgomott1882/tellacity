import type { ArticleTopic } from "@/lib/articles/articleCategories";
import type { ArticleContentDoc, ArticleContentType, ArticleFaqItem } from "@/lib/articles/types";

export type PlatformArticleStatus = "draft" | "published" | "archived";

export type PlatformArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string;
  content: ArticleContentDoc;
  content_type: ArticleContentType;
  topic: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  client_industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  author_name: string | null;
  author_title: string | null;
  author_bio: string | null;
  author_avatar_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  key_takeaways: string[] | null;
  faq: ArticleFaqItem[] | null;
  tags: string[] | null;
  primary_keyword: string | null;
  target_audience: string | null;
  content_goal: string | null;
  status: PlatformArticleStatus;
  published_at: string | null;
  author_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformArticleInput = {
  title: string;
  slug: string;
  excerpt?: string | null;
  body_html: string;
  topic: ArticleTopic;
  featured_image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status: PlatformArticleStatus;
};

export function slugifyPlatformArticleTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function normalizePlatformArticleTopic(raw: string): ArticleTopic {
  const topics: ArticleTopic[] = [
    "Reviews",
    "Trust",
    "Consumer Safety",
    "Platform Updates",
    "Comparisons",
    "Business Growth",
  ];
  const match = topics.find((t) => t.toLowerCase() === raw.trim().toLowerCase());
  return match ?? "Platform Updates";
}
