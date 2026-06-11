export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { UUID_RE, jsonError } from "../../_shared";
import {
  parseArticleImageKind,
  registerArticleImage,
  resolveArticleOwnerBusinessId,
} from "../../_registerArticleImage";

type RouteParams = {
  params: Promise<{ businessId: string; articleId: string }>;
};

export async function POST(req: Request, ctx: RouteParams) {
  const { businessId: pathBusinessId, articleId } = await ctx.params;
  if (!UUID_RE.test(pathBusinessId) || !UUID_RE.test(articleId)) {
    return jsonError("Invalid id");
  }

  const { ownerBusinessId, error: resolveErr } = await resolveArticleOwnerBusinessId(articleId);
  if (resolveErr || !ownerBusinessId) {
    const status = resolveErr === "Invalid id" ? 400 : 404;
    return NextResponse.json({ error: resolveErr ?? "Article not found" }, { status });
  }

  const access = await requireBusinessAccess(req, ownerBusinessId);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const storagePath =
    typeof body?.storagePath === "string" ? body.storagePath.trim() : "";
  const kind = parseArticleImageKind(body?.kind);

  const { data, error } = await registerArticleImage(access.db, access.userId, {
    articleId,
    url,
    storagePath,
    kind,
  });

  if (error) {
    const status =
      error === "Invalid id" ||
      error === "Invalid image URL" ||
      error === "storagePath is required"
        ? 400
        : error === "Article not found"
          ? 404
          : error.includes("permission")
            ? 403
            : 500;
    if (status === 500) {
      console.error("[articles/[articleId]/images POST]", error);
    }
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json(
    { image: data, ownerBusinessId },
    { status: 201 },
  );
}
