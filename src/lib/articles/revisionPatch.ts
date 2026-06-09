import type { SupabaseClient } from "@supabase/supabase-js";
import {
  plainTextFromDoc,
  sanitizeArticleContent,
} from "@/lib/articles/sanitize";
import { enforceArticleLinkValidation } from "@/lib/articles/linkValidation/serverEnforce";
import { applyEditorialFieldsPatch } from "@/lib/articles/editorialFields";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { parseArticleContentType } from "@/lib/articles/types";

export type ArticlePatchInput = Record<string, unknown>;

export type ArticlePatchResult =
  | { ok: true; patch: Record<string, unknown> }
  | { ok: false; status: number; message: string; issues?: unknown[] };

type ExistingContent = {
  content: ArticleContentDoc;
  client_industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  title: string;
};

export function buildArticleContentPatch(
  body: ArticlePatchInput | null,
  existing: ExistingContent,
  options?: { lockTitle?: boolean },
): ArticlePatchResult {
  const patch: Record<string, unknown> = {};

  if (typeof body?.title === "string") {
    const nextTitle = body.title.trim().slice(0, 200) || "Untitled draft";
    if (!options?.lockTitle) {
      patch.title = nextTitle;
    }
  }

  if (body?.content !== undefined) {
    const content = sanitizeArticleContent(body.content);
    patch.content = content;
    if (body.excerpt === undefined) {
      patch.excerpt = plainTextFromDoc(content, 280);
    }
  }

  if (typeof body?.excerpt === "string") {
    patch.excerpt = body.excerpt.trim().slice(0, 500);
  }

  if (typeof body?.featuredImageUrl === "string" || body?.featured_image_url !== undefined) {
    const url = String(body.featuredImageUrl ?? body.featured_image_url ?? "").trim();
    patch.featured_image_url = url || null;
  }

  const contentType = parseArticleContentType(body?.contentType ?? body?.content_type);
  if (contentType) patch.content_type = contentType;

  if (contentType === "case_study" || body?.clientIndustry !== undefined) {
    patch.client_industry =
      typeof body?.clientIndustry === "string"
        ? body.clientIndustry.trim().slice(0, 200)
        : null;
    patch.challenge =
      typeof body?.challenge === "string" ? body.challenge.trim().slice(0, 5000) : null;
    patch.solution =
      typeof body?.solution === "string" ? body.solution.trim().slice(0, 5000) : null;
    patch.results =
      typeof body?.results === "string" ? body.results.trim().slice(0, 5000) : null;
  }

  if (body?.authorName !== undefined || body?.author_name !== undefined) {
    const name = String(body.authorName ?? body.author_name ?? "").trim();
    patch.author_name = name ? name.slice(0, 120) : null;
  }

  if (body?.authorTitle !== undefined || body?.author_title !== undefined) {
    const title = String(body.authorTitle ?? body.author_title ?? "").trim();
    patch.author_title = title ? title.slice(0, 120) : null;
  }

  applyEditorialFieldsPatch(body, patch);

  if (Object.keys(patch).length === 0) {
    return { ok: false, status: 400, message: "No valid fields to update" };
  }

  return { ok: true, patch };
}

export async function validateArticlePatchLinks(
  db: SupabaseClient,
  params: {
    businessId: string;
    articleId: string;
    patch: Record<string, unknown>;
    existing: ExistingContent;
  },
): Promise<ArticlePatchResult> {
  const finalContent = (params.patch.content ?? params.existing.content) as ArticleContentDoc;
  const finalCaseStudy = {
    clientIndustry:
      params.patch.client_industry !== undefined
        ? (params.patch.client_industry as string | null)
        : params.existing.client_industry,
    challenge:
      params.patch.challenge !== undefined
        ? (params.patch.challenge as string | null)
        : params.existing.challenge,
    solution:
      params.patch.solution !== undefined
        ? (params.patch.solution as string | null)
        : params.existing.solution,
    results:
      params.patch.results !== undefined
        ? (params.patch.results as string | null)
        : params.existing.results,
  };

  const linkCheck = await enforceArticleLinkValidation(db, {
    businessId: params.businessId,
    articleId: params.articleId,
    input: {
      content: finalContent,
      caseStudyFields: finalCaseStudy,
    },
  });

  if (!linkCheck.ok) {
    return {
      ok: false,
      status: 400,
      message: linkCheck.message,
      issues: linkCheck.result.issues,
    };
  }

  return { ok: true, patch: params.patch };
}
