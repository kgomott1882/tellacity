export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
import { enforceArticleLinkValidation } from "@/lib/articles/linkValidation/serverEnforce";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { UUID_RE, jsonError } from "../../_shared";

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

  const { data: row } = await access.db
    .from("articles")
    .select("id, content, client_industry, challenge, solution, results")
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();
  if (!row) return jsonError("Article not found", 404);

  const linkCheck = await enforceArticleLinkValidation(access.db, {
    businessId,
    articleId,
    input: {
      content: (row.content ?? { type: "doc", content: [] }) as ArticleContentDoc,
      caseStudyFields: {
        clientIndustry: row.client_industry,
        challenge: row.challenge,
        solution: row.solution,
        results: row.results,
      },
    },
  });
  if (!linkCheck.ok) {
    return NextResponse.json({ error: linkCheck.message, issues: linkCheck.result.issues }, { status: 400 });
  }

  const { data, error } = await access.db.rpc("submit_article_for_review", {
    p_article_id: articleId,
  });

  if (error) {
    const msg = error.message ?? "Submit failed";
    const needsUpgrade =
      msg.includes("Grow plan") ||
      msg.includes("limit") ||
      msg.includes("Article submissions require");
    const status = needsUpgrade ? 402 : 400;
    return NextResponse.json(
      {
        error: msg,
        code: needsUpgrade ? "plan_upgrade_required" : "submit_failed",
      },
      { status },
    );
  }

  return NextResponse.json({ ok: true, result: data });
}
