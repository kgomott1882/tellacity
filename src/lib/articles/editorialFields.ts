import type { ArticleFaqItem } from "@/lib/articles/types";

const ARTICLE_MEDIA_PUBLIC_MARKER = "/storage/v1/object/public/article_media/" as const;

const STRIP_HTML_RE = /<[^>]*>/g;

export function stripPlainText(raw: unknown, maxLen: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(STRIP_HTML_RE, "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeMetaTitle(raw: unknown): string | null {
  const v = stripPlainText(raw, 70);
  return v || null;
}

export function sanitizeMetaDescription(raw: unknown): string | null {
  const v = stripPlainText(raw, 320);
  return v || null;
}

export function sanitizeFeaturedImageAlt(raw: unknown): string | null {
  const v = stripPlainText(raw, 500);
  return v || null;
}

export function sanitizeFeaturedImageDimension(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(10000, Math.round(n));
}

export function sanitizePrimaryKeyword(raw: unknown): string | null {
  const v = stripPlainText(raw, 120);
  return v || null;
}

export function sanitizeTargetAudience(raw: unknown): string | null {
  const v = stripPlainText(raw, 200);
  return v || null;
}

export function sanitizeContentGoal(raw: unknown): string | null {
  const v = stripPlainText(raw, 300);
  return v || null;
}

export function sanitizeAuthorBio(raw: unknown): string | null {
  const v = stripPlainText(raw, 500);
  return v || null;
}

export function sanitizeAuthorAvatarUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const url = raw.trim();
  if (!url.startsWith("https://") && !url.startsWith("http://")) return null;
  if (!url.includes(ARTICLE_MEDIA_PUBLIC_MARKER)) return null;
  return url.slice(0, 2048);
}

export function sanitizeKeyTakeaways(raw: unknown): string[] | null {
  if (raw === null || raw === undefined) return null;
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const item of raw) {
    const text = stripPlainText(item, 280);
    if (text) out.push(text);
    if (out.length >= 8) break;
  }
  return out.length > 0 ? out : null;
}

export function sanitizeFaq(raw: unknown): ArticleFaqItem[] | null {
  if (raw === null || raw === undefined) return null;
  if (!Array.isArray(raw)) return null;
  const out: ArticleFaqItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const question = stripPlainText(row.question ?? row.q, 300);
    const answer = stripPlainText(row.answer ?? row.a, 2000);
    if (question && answer) out.push({ question, answer });
    if (out.length >= 12) break;
  }
  return out.length > 0 ? out : null;
}

export function sanitizeTags(raw: unknown): string[] | null {
  if (raw === null || raw === undefined) return null;
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const tag = stripPlainText(item, 40).toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= 6) break;
  }
  return out.length > 0 ? out : null;
}

/** Map camelCase/snake_case API body fields onto a DB patch object. */
export function applyEditorialFieldsPatch(
  body: Record<string, unknown> | null,
  patch: Record<string, unknown>,
): void {
  if (!body) return;

  if (body.metaTitle !== undefined || body.meta_title !== undefined) {
    patch.meta_title = sanitizeMetaTitle(body.metaTitle ?? body.meta_title);
  }

  if (body.metaDescription !== undefined || body.meta_description !== undefined) {
    patch.meta_description = sanitizeMetaDescription(
      body.metaDescription ?? body.meta_description,
    );
  }

  if (body.featuredImageAlt !== undefined || body.featured_image_alt !== undefined) {
    patch.featured_image_alt = sanitizeFeaturedImageAlt(
      body.featuredImageAlt ?? body.featured_image_alt,
    );
  }

  if (body.featuredImageWidth !== undefined || body.featured_image_width !== undefined) {
    patch.featured_image_width = sanitizeFeaturedImageDimension(
      body.featuredImageWidth ?? body.featured_image_width,
    );
  }

  if (body.featuredImageHeight !== undefined || body.featured_image_height !== undefined) {
    patch.featured_image_height = sanitizeFeaturedImageDimension(
      body.featuredImageHeight ?? body.featured_image_height,
    );
  }

  if (body.keyTakeaways !== undefined || body.key_takeaways !== undefined) {
    patch.key_takeaways = sanitizeKeyTakeaways(body.keyTakeaways ?? body.key_takeaways);
  }

  if (body.faq !== undefined) {
    patch.faq = sanitizeFaq(body.faq);
  }

  if (body.tags !== undefined) {
    patch.tags = sanitizeTags(body.tags);
  }

  if (body.primaryKeyword !== undefined || body.primary_keyword !== undefined) {
    patch.primary_keyword = sanitizePrimaryKeyword(
      body.primaryKeyword ?? body.primary_keyword,
    );
  }

  if (body.targetAudience !== undefined || body.target_audience !== undefined) {
    patch.target_audience = sanitizeTargetAudience(
      body.targetAudience ?? body.target_audience,
    );
  }

  if (body.contentGoal !== undefined || body.content_goal !== undefined) {
    patch.content_goal = sanitizeContentGoal(body.contentGoal ?? body.content_goal);
  }

  if (body.authorBio !== undefined || body.author_bio !== undefined) {
    patch.author_bio = sanitizeAuthorBio(body.authorBio ?? body.author_bio);
  }

  if (body.authorAvatarUrl !== undefined || body.author_avatar_url !== undefined) {
    patch.author_avatar_url = sanitizeAuthorAvatarUrl(
      body.authorAvatarUrl ?? body.author_avatar_url,
    );
  }
}
