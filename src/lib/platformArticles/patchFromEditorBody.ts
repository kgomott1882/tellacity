import type { SupabaseClient } from "@supabase/supabase-js";
import {
  plainTextFromDoc,
  sanitizeArticleContent,
} from "@/lib/articles/sanitize";
import { applyEditorialFieldsPatch } from "@/lib/articles/editorialFields";
import { validateArticleContent } from "@/lib/articles/validation/ArticleValidationService";
import { articleDocToHtml } from "@/lib/articles/articleContentConversion";
import { adminPlatformArticleLinkInput } from "@/lib/platformArticles/linkValidation";
import {
  slugifyPlatformArticleTitle,
  type PlatformArticleStatus,
} from "@/lib/platformArticles/types";
import type { ArticleContentDoc } from "@/lib/articles/types";

function parseContentType(raw: unknown): "article" | "case_study" | undefined {
  const v = String(raw ?? "").trim();
  if (v === "article" || v === "case_study") return v;
  return undefined;
}

function parseStatus(raw: unknown): PlatformArticleStatus | undefined {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "draft" || v === "published" || v === "archived") return v;
  return undefined;
}

export type PlatformArticlePatchResult =
  | { ok: true; patch: Record<string, unknown> }
  | { ok: false; message: string; issues?: unknown[] };

export function buildPlatformArticlePatch(
  body: Record<string, unknown> | null,
  existing: {
    title: string;
    slug: string;
    status: string;
    published_at: string | null;
    content?: ArticleContentDoc;
    client_industry?: string | null;
    challenge?: string | null;
    solution?: string | null;
    results?: string | null;
  },
): PlatformArticlePatchResult {
  if (!body) {
    return { ok: false, message: "Invalid JSON body" };
  }

  const patch: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    patch.title = body.title.trim().slice(0, 200) || "Untitled draft";
  }

  if (body.content !== undefined) {
    const content = sanitizeArticleContent(body.content);
    patch.content = content;
    patch.body_html = articleDocToHtml(content);
    if (body.excerpt === undefined) {
      patch.excerpt = plainTextFromDoc(content, 280);
    }
  }

  if (typeof body.excerpt === "string") {
    patch.excerpt = body.excerpt.trim().slice(0, 500) || null;
  }

  if (typeof body.featuredImageUrl === "string" || body.featured_image_url !== undefined) {
    const url = String(body.featuredImageUrl ?? body.featured_image_url ?? "").trim();
    patch.featured_image_url = url || null;
  }

  const contentType = parseContentType(body.contentType ?? body.content_type);
  if (contentType) patch.content_type = contentType;

  if (contentType === "case_study" || body.clientIndustry !== undefined) {
    patch.client_industry =
      typeof body.clientIndustry === "string"
        ? body.clientIndustry.trim().slice(0, 200)
        : null;
    patch.challenge =
      typeof body.challenge === "string" ? body.challenge.trim().slice(0, 5000) : null;
    patch.solution =
      typeof body.solution === "string" ? body.solution.trim().slice(0, 5000) : null;
    patch.results =
      typeof body.results === "string" ? body.results.trim().slice(0, 5000) : null;
  }

  if (body.authorName !== undefined || body.author_name !== undefined) {
    const name = String(body.authorName ?? body.author_name ?? "").trim();
    patch.author_name = name ? name.slice(0, 120) : null;
  }

  if (body.authorTitle !== undefined || body.author_title !== undefined) {
    const title = String(body.authorTitle ?? body.author_title ?? "").trim();
    patch.author_title = title ? title.slice(0, 120) : null;
  }

  applyEditorialFieldsPatch(body, patch);

  if (typeof body.slug === "string" && body.slug.trim()) {
    patch.slug = body.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } else if (typeof patch.title === "string" && patch.title !== existing.title) {
    patch.slug = slugifyPlatformArticleTitle(String(patch.title));
  }

  const nextStatus = parseStatus(body.status);
  if (nextStatus) {
    patch.status = nextStatus;
    if (nextStatus === "published" && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
    if (nextStatus === "draft") {
      patch.published_at = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: "No valid fields to update" };
  }

  const finalContent = (patch.content ?? existing.content ?? sanitizeArticleContent(null)) as ArticleContentDoc;
  const finalCaseStudy = {
    clientIndustry:
      patch.client_industry !== undefined
        ? (patch.client_industry as string | null)
        : existing.client_industry,
    challenge:
      patch.challenge !== undefined ? (patch.challenge as string | null) : existing.challenge,
    solution:
      patch.solution !== undefined ? (patch.solution as string | null) : existing.solution,
    results:
      patch.results !== undefined ? (patch.results as string | null) : existing.results,
  };

  const validation = validateArticleContent(
    adminPlatformArticleLinkInput({
      content: finalContent,
      caseStudyFields: finalCaseStudy,
      businessWebsite: null,
    }),
  );

  if (!validation.ok) {
    return {
      ok: false,
      message: validation.issues[0]?.message ?? "Article link validation failed.",
      issues: validation.issues,
    };
  }

  return { ok: true, patch };
}

export async function assertUniquePlatformSlug(
  admin: SupabaseClient,
  slug: string,
  excludeId?: string,
): Promise<string | null> {
  let query = admin.from("platform_articles").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  return data ? "Slug already in use" : null;
}
