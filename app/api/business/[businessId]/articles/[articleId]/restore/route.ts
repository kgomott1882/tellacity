export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
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

  const { data: existing } = await access.db
    .from("articles")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();

  if (!existing) return jsonError("Article not found", 404);
  if (String(existing.status) !== "archived") {
    return jsonError("Only archived articles can be restored", 409);
  }

  const { data, error } = await access.db.rpc("restore_article", {
    p_article_id: articleId,
  });

  if (error) {
    return NextResponse.json({ error: error.message ?? "Restore failed" }, { status: 400 });
  }

  const { data: article } = await access.db
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .maybeSingle();

  return NextResponse.json({ ok: true, result: data, article });
}
