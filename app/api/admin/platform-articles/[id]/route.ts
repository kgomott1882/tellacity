export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("platform_articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin/platform-articles/[id] GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ article: data });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const { data: existing, error: loadErr } = await auth.admin
    .from("platform_articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "archived") {
    return NextResponse.json({ error: "Archived articles cannot be edited" }, { status: 409 });
  }

  const [
    { buildPlatformArticlePatch, assertUniquePlatformSlug },
    { resolvePlatformArticleContent },
  ] = await Promise.all([
    import("@/lib/platformArticles/patchFromEditorBody"),
    import("@/lib/articles/articleContentConversion"),
  ]);

  const built = buildPlatformArticlePatch(body, {
    title: existing.title,
    slug: existing.slug,
    status: existing.status,
    published_at: existing.published_at,
    content: resolvePlatformArticleContent(
      existing.content as import("@/lib/articles/types").ArticleContentDoc | null,
      existing.body_html,
    ),
    client_industry: existing.client_industry,
    challenge: existing.challenge,
    solution: existing.solution,
    results: existing.results,
  });

  if (!built.ok) {
    return NextResponse.json(
      { error: built.message, issues: built.issues },
      { status: 400 },
    );
  }

  if (typeof built.patch.slug === "string") {
    const slugErr = await assertUniquePlatformSlug(auth.admin, built.patch.slug, id);
    if (slugErr) {
      return NextResponse.json({ error: slugErr }, { status: 409 });
    }
  }

  const { data, error } = await auth.admin
    .from("platform_articles")
    .update(built.patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    console.error("[admin/platform-articles/[id] PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ article: data });
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { error } = await auth.admin.from("platform_articles").delete().eq("id", id);
  if (error) {
    console.error("[admin/platform-articles/[id] DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
