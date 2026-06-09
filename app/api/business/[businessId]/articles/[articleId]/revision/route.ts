export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
import {
  buildArticleContentPatch,
  validateArticlePatchLinks,
} from "@/lib/articles/revisionPatch";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { UUID_RE, jsonError } from "../../_shared";

type RouteParams = {
  params: Promise<{ businessId: string; articleId: string }>;
};

export async function PATCH(req: Request, ctx: RouteParams) {
  const { businessId, articleId } = await ctx.params;
  if (!UUID_RE.test(businessId) || !UUID_RE.test(articleId)) {
    return jsonError("Invalid id");
  }

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const write = await requireArticleWriteAccess(access.db, access.userId, businessId);
  if (!write.ok) return jsonError(write.message, 403);

  const { data: article, error: fetchErr } = await access.db
    .from("articles")
    .select("id, status, active_revision_id")
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!article) return jsonError("Article not found", 404);
  if (String(article.status) !== "published" || !article.active_revision_id) {
    return jsonError("No active revision to edit", 409);
  }

  const { data: revision, error: revFetchErr } = await access.db
    .from("article_revisions")
    .select(
      "id, status, title, content, client_industry, challenge, solution, results",
    )
    .eq("id", article.active_revision_id)
    .eq("article_id", articleId)
    .maybeSingle();

  if (revFetchErr) return NextResponse.json({ error: revFetchErr.message }, { status: 500 });
  if (!revision) return jsonError("Revision not found", 404);
  if (!["draft", "rejected"].includes(String(revision.status))) {
    return jsonError("This update is locked while pending review", 409);
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const built = buildArticleContentPatch(body, {
    title: String(revision.title ?? ""),
    content: (revision.content ?? { type: "doc", content: [] }) as ArticleContentDoc,
    client_industry: revision.client_industry,
    challenge: revision.challenge,
    solution: revision.solution,
    results: revision.results,
  }, { lockTitle: true });
  if (!built.ok) {
    return NextResponse.json(
      { error: built.message, issues: built.issues },
      { status: built.status },
    );
  }

  const validated = await validateArticlePatchLinks(access.db, {
    businessId,
    articleId,
    patch: built.patch,
    existing: {
      title: String(revision.title ?? ""),
      content: (revision.content ?? { type: "doc", content: [] }) as ArticleContentDoc,
      client_industry: revision.client_industry,
      challenge: revision.challenge,
      solution: revision.solution,
      results: revision.results,
    },
  });
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.message, issues: validated.issues },
      { status: validated.status },
    );
  }

  const { data, error } = await access.db
    .from("article_revisions")
    .update(validated.patch)
    .eq("id", revision.id)
    .in("status", ["draft", "rejected"])
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return jsonError("Update failed", 409);

  return NextResponse.json({ revision: data });
}
