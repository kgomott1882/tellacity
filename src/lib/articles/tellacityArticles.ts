import {
  getAllBlogPosts,
  getBlogPostBySlug,
  type BlogPost,
} from "../../../data/blogPosts";
import {
  getTellacityArticleTopic,
  type ArticleTopic,
} from "./articleCategories";

export type TellacityArticle = BlogPost & {
  topic: ArticleTopic;
  hasLegacyPage: boolean;
  /** Optional public byline from platform article setup. */
  authorName?: string | null;
  authorTitle?: string | null;
};

const LEGACY_PAGE_SLUGS = new Set([
  "import-reviews",
  "claim-tellacity-profile",
  "check-business-legit-2025",
  "what-makes-a-review-useful-2025",
  "platform-update-2025",
  "trust-score-2025",
  "verified-review-2025",
  "online-shopping-scams-2025",
  "shopping-online-safely-2025",
]);

const PLACEHOLDER_CONTENT = "<p>Full article available on this page.</p>";

export function tellacityArticleHasHtmlBody(post: BlogPost): boolean {
  const trimmed = post.content.trim();
  return trimmed.length > 0 && trimmed !== PLACEHOLDER_CONTENT;
}

export function tellacityArticleHasLegacyPage(slug: string): boolean {
  return LEGACY_PAGE_SLUGS.has(slug.trim().toLowerCase());
}

export function toTellacityArticle(post: BlogPost): TellacityArticle | null {
  const slug = post.slug.trim().toLowerCase();
  const topic = getTellacityArticleTopic(slug);
  if (!topic) return null;
  return {
    ...post,
    slug,
    topic,
    hasLegacyPage: tellacityArticleHasLegacyPage(slug),
  };
}

export function getAllTellacityArticles(): TellacityArticle[] {
  return getAllBlogPosts()
    .map(toTellacityArticle)
    .filter((post): post is TellacityArticle => Boolean(post));
}

export function getTellacityArticleBySlug(slug: string): TellacityArticle | undefined {
  const post = getBlogPostBySlug(slug.trim().toLowerCase());
  if (!post) return undefined;
  return toTellacityArticle(post) ?? undefined;
}

export function isTellacityArticleSlug(slug: string): boolean {
  return Boolean(getTellacityArticleBySlug(slug));
}
