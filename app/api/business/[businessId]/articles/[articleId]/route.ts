export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
import {
  plainTextFromDoc,
  sanitizeArticleContent,
} from "@/lib/articles/sanitize";
import { allocateArticleSlug, loadTakenArticleSlugs } from "@/lib/articles/articleSlugServer";
import { isValidArticleSlug, resolveUniqueSlug, slugifyTitle } from "@/lib/articles/slug";
import { applyEditorialFieldsPatch } from "@/lib/articles/editorialFields";
import { enforceArticleLinkValidation } from "@/lib/articles/linkValidation/serverEnforce";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { UUID_RE, jsonError, parseContentType } from "../_shared";

type RouteParams = {
  params: Promise<{ businessId: string; articleId: string }>;
};

export async function GET(req: Request, ctx: RouteParams) {
  const { businessId, articleId } = await ctx.params;
  if (!UUID_RE.test(businessId) || !UUID_RE.test(articleId)) {
    return jsonError("Invalid id");
  }

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const { data, error } = await access.db
    .from("articles")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return jsonError("Article not found", 404);

  let revision = null;
  if (data.active_revision_id) {
    const { data: rev } = await access.db
      .from("article_revisions")
      .select("*")
      .eq("id", data.active_revision_id)
      .maybeSingle();
    revision = rev;
  }

  return NextResponse.json({ article: data, revision });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  const { businessId, articleId } = await ctx.params;
  if (!UUID_RE.test(businessId) || !UUID_RE.test(articleId)) {
    return jsonError("Invalid id");
  }

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const write = await requireArticleWriteAccess(access.db, access.userId, businessId);
  if (!write.ok) return jsonError(write.message, 403);

  const { data: existing, error: fetchErr } = await access.db
    .from("articles")
    .select(
      "id, status, slug, title, content, client_industry, challenge, solution, results",
    )
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return jsonError("Article not found", 404);
  if (!["draft", "rejected"].includes(String(existing.status))) {
    return jsonError("Only draft or rejected articles can be edited", 409);
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = {};

  if (typeof body?.title === "string") {
    patch.title = body.title.trim().slice(0, 200) || "Untitled draft";
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

  const contentType = parseContentType(body?.contentType ?? body?.content_type);
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

  if (typeof body?.slug === "string") {
    const nextSlug = slugifyTitle(body.slug);
    if (!isValidArticleSlug(nextSlug)) {
      return jsonError("Invalid slug format");
    }
    if (nextSlug !== existing.slug) {
      try {
        const taken = await loadTakenArticleSlugs(articleId);
        patch.slug = taken.has(nextSlug)
          ? resolveUniqueSlug(nextSlug, taken)
          : nextSlug;
      } catch (slugErr) {
        console.error("[articles PATCH] slug check", slugErr);
        return jsonError("Could not validate article slug", 500);
      }
    }
  } else if (typeof patch.title === "string" && patch.title !== existing.title) {
    try {
      patch.slug = await allocateArticleSlug({
        title: String(patch.title),
        excludeArticleId: articleId,
      });
    } catch (slugErr) {
      console.error("[articles PATCH] slug allocation", slugErr);
      return jsonError("Could not allocate article slug", 500);
    }
  }

  if (Object.keys(patch).length === 0) {
    return jsonError("No valid fields to update");
  }

  const finalContent = (patch.content ?? existing.content) as ArticleContentDoc;
  const finalCaseStudy = {
    clientIndustry:
      patch.client_industry !== undefined
        ? (patch.client_industry as string | null)
        : existing.client_industry,
    challenge:
      patch.challenge !== undefined
        ? (patch.challenge as string | null)
        : existing.challenge,
    solution:
      patch.solution !== undefined ? (patch.solution as string | null) : existing.solution,
    results:
      patch.results !== undefined ? (patch.results as string | null) : existing.results,
  };

  const linkCheck = await enforceArticleLinkValidation(access.db, {
    businessId,
    articleId,
    input: {
      content: finalContent,
      caseStudyFields: finalCaseStudy,
    },
  });
  if (!linkCheck.ok) {
    return NextResponse.json({ error: linkCheck.message, issues: linkCheck.result.issues }, { status: 400 });
  }

  const { data, error } = await access.db
    .from("articles")
    .update(patch)
    .eq("business_id", businessId)
    .eq("id", articleId)
    .in("status", ["draft", "rejected"])
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return jsonError("Update failed", 409);

  return NextResponse.json({ article: data });
}

export async function DELETE(req: Request, ctx: RouteParams) {
  const { businessId, articleId } = await ctx.params;
  if (!UUID_RE.test(businessId) || !UUID_RE.test(articleId)) {
    return jsonError("Invalid id");
  }

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const write = await requireArticleWriteAccess(access.db, access.userId, businessId);
  if (!write.ok) return jsonError(write.message, 403);

  const { error } = await access.db
    .from("articles")
    .delete()
    .eq("business_id", businessId)
    .eq("id", articleId)
    .in("status", ["draft", "rejected"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
