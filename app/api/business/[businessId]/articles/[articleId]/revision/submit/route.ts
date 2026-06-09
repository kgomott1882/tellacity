export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
import { enforceArticleLinkValidation } from "@/lib/articles/linkValidation/serverEnforce";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { UUID_RE, jsonError } from "@/lib/articles/businessArticlesRouteShared";

type RouteParams = {
  params: Promise<{ businessId: string; articleId: string }>;
};

export async function POST(req: Request, ctx: RouteParams) {
  const { businessId, articleId } = await ctx.params;
  if (!UUID_RE.test(businessId) || !UUID_RE.test(articleId)) {
    return jsonError("Invalid id");
  }

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const write = await requireArticleWriteAccess(access.db, access.userId, businessId);
  if (!write.ok) return jsonError(write.message, 403);

  const { data: article } = await access.db
    .from("articles")
    .select("id, status, active_revision_id")
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();

  if (!article) return jsonError("Article not found", 404);
  if (String(article.status) !== "published" || !article.active_revision_id) {
    return jsonError("No active revision to submit", 409);
  }

  const { data: revision } = await access.db
    .from("article_revisions")
    .select(
      "id, status, title, content, client_industry, challenge, solution, results",
    )
    .eq("id", article.active_revision_id)
    .eq("article_id", articleId)
    .maybeSingle();

  if (!revision) return jsonError("Revision not found", 404);

  const linkCheck = await enforceArticleLinkValidation(access.db, {
    businessId,
    articleId,
    input: {
      content: (revision.content ?? { type: "doc", content: [] }) as ArticleContentDoc,
      caseStudyFields: {
        clientIndustry: revision.client_industry,
        challenge: revision.challenge,
        solution: revision.solution,
        results: revision.results,
      },
    },
  });
  if (!linkCheck.ok) {
    return NextResponse.json(
      { error: linkCheck.message, issues: linkCheck.result.issues },
      { status: 400 },
    );
  }

  const { data, error } = await access.db.rpc("submit_article_revision", {
    p_revision_id: revision.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message ?? "Submit failed" }, { status: 400 });
  }

  const { data: updatedRevision } = await access.db
    .from("article_revisions")
    .select("*")
    .eq("id", revision.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, result: data, revision: updatedRevision });
}
