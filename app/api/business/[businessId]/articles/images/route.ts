export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
import {
  ARTICLE_MEDIA_PUBLIC_MARKER,
  UUID_RE,
  jsonError,
} from "../_shared";

type RouteParams = { params: Promise<{ businessId: string }> };

function parseKind(raw: unknown): "featured" | "inline" {
  return String(raw ?? "").trim().toLowerCase() === "featured" ? "featured" : "inline";
}

export async function POST(req: Request, ctx: RouteParams) {
  const { businessId } = await ctx.params;
  if (!UUID_RE.test(businessId)) return jsonError("Invalid business id");

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const write = await requireArticleWriteAccess(access.db, access.userId, businessId);
  if (!write.ok) return jsonError(write.message, 403);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const storagePath =
    typeof body?.storagePath === "string" ? body.storagePath.trim() : "";
  const articleId =
    typeof body?.articleId === "string" && UUID_RE.test(body.articleId)
      ? body.articleId
      : null;
  const kind = parseKind(body?.kind);

  if (!url || !url.includes(ARTICLE_MEDIA_PUBLIC_MARKER)) {
    return jsonError("Invalid image URL");
  }
  if (!storagePath) return jsonError("storagePath is required");

  const { data, error } = await access.db
    .from("article_images")
    .insert({
      business_id: businessId,
      article_id: articleId,
      storage_path: storagePath,
      public_url: url,
      kind,
    })
    .select("id, public_url, kind, article_id")
    .single();

  if (error) {
    console.error("[articles/images POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ image: data }, { status: 201 });
}
