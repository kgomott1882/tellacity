export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import { syncTellacityCatalogToPlatformArticles } from "@/lib/platformArticles/syncCatalog";
import { emptyArticleDoc } from "@/lib/articles/sanitize";
import type { ArticleContentType } from "@/lib/articles/types";

function parseContentType(raw: unknown): ArticleContentType {
  return String(raw ?? "").trim() === "case_study" ? "case_study" : "article";
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  let { data, error } = await auth.admin
    .from("platform_articles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!error && (data ?? []).length === 0) {
    await syncTellacityCatalogToPlatformArticles(auth.admin);
    const refetch = await auth.admin
      .from("platform_articles")
      .select("*")
      .order("updated_at", { ascending: false });
    data = refetch.data;
    error = refetch.error;
  }

  if (error) {
    console.error("[admin/platform-articles GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const contentType = parseContentType(body?.contentType ?? body?.content_type);
  const title = String(body?.title ?? "").trim();

  const { data, error } = await auth.admin
    .from("platform_articles")
    .insert({
      title: title || "Untitled draft",
      slug: `draft-${Date.now()}`,
      excerpt: null,
      body_html: "",
      content: emptyArticleDoc(),
      content_type: contentType,
      topic: "Platform Updates",
      status: "draft",
      author_user_id: auth.userId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[admin/platform-articles POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ article: data }, { status: 201 });
}
