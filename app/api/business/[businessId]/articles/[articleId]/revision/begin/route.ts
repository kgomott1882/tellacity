export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
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

  const { data: existing } = await access.db
    .from("articles")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();

  if (!existing) return jsonError("Article not found", 404);
  if (String(existing.status) !== "published") {
    return jsonError("Only published articles can be edited with a revision", 409);
  }

  const { data, error } = await access.db.rpc("begin_article_revision", {
    p_article_id: articleId,
  });

  if (error) {
    return NextResponse.json({ error: error.message ?? "Could not start revision" }, { status: 400 });
  }

  const revisionId = (data as { revision_id?: string } | null)?.revision_id;
  if (!revisionId) {
    return jsonError("Could not start revision", 500);
  }

  const { data: revision, error: revErr } = await access.db
    .from("article_revisions")
    .select("*")
    .eq("id", revisionId)
    .maybeSingle();

  if (revErr) return NextResponse.json({ error: revErr.message }, { status: 500 });
  if (!revision) return jsonError("Revision not found", 404);

  return NextResponse.json({ ok: true, result: data, revision });
}
