export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import { emptyArticleDoc } from "@/lib/articles/sanitize";
import type { ArticleContentType } from "@/lib/articles/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ id: string }> };

function parseContentType(raw: unknown): ArticleContentType {
  return String(raw ?? "").trim() === "case_study" ? "case_study" : "article";
}

export async function POST(req: Request, ctx: RouteParams) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id: articleId } = await ctx.params;
  if (!UUID_RE.test(articleId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const url = String(body?.url ?? "").trim();
  const storagePath = String(body?.storagePath ?? "").trim();
  const kind = String(body?.kind ?? "inline").trim();

  if (!url || !storagePath) {
    return NextResponse.json({ error: "url and storagePath are required" }, { status: 400 });
  }
  if (kind !== "featured" && kind !== "inline") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const { data: article, error: loadErr } = await auth.admin
    .from("platform_articles")
    .select("id")
    .eq("id", articleId)
    .maybeSingle();

  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 500 });
  }
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, url, storagePath, kind }, { status: 201 });
}
