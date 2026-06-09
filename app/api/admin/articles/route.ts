import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

export const dynamic = "force-dynamic";

export async function GET() {
  const userClient = await createSupabaseServerCookies();
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await userClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/articles] env", e);
    return NextResponse.json({ error: "Service misconfigured" }, { status: 500 });
  }

  const { data: articles, error } = await admin
    .from("articles")
    .select(
      "id, business_id, title, slug, content_type, status, submitted_at, created_at, updated_at, featured_image_url, excerpt, content, client_industry, challenge, solution, results, current_version",
    )
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[admin/articles] fetch", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: revisions, error: revErr } = await admin
    .from("article_revisions")
    .select(
      "id, article_id, version_number, title, content_type, status, submitted_at, created_at, updated_at, featured_image_url, excerpt, content, client_industry, challenge, solution, results",
    )
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: true, nullsFirst: false });

  if (revErr) {
    console.error("[admin/articles] revisions fetch", revErr);
    return NextResponse.json({ error: revErr.message }, { status: 500 });
  }

  const parentArticleIds = [
    ...new Set(
      (revisions ?? []).map((r) => String((r as { article_id: string }).article_id)),
    ),
  ];

  const parentArticlesById = new Map<
    string,
    {
      id: string;
      business_id: string;
      title: string;
      slug: string;
      status: string;
      current_version: number | null;
    }
  >();

  if (parentArticleIds.length > 0) {
    const { data: parentArticles, error: parentErr } = await admin
      .from("articles")
      .select("id, business_id, title, slug, status, current_version")
      .in("id", parentArticleIds);

    if (parentErr) {
      console.error("[admin/articles] parent articles fetch", parentErr);
      return NextResponse.json({ error: parentErr.message }, { status: 500 });
    }

    for (const row of parentArticles ?? []) {
      const a = row as {
        id: string;
        business_id: string;
        title: string;
        slug: string;
        status: string;
        current_version: number | null;
      };
      parentArticlesById.set(a.id, a);
    }
  }

  const businessIds = new Set<string>();
  for (const a of articles ?? []) {
    businessIds.add(String((a as { business_id: string }).business_id));
  }
  for (const parent of parentArticlesById.values()) {
    businessIds.add(String(parent.business_id));
  }

  const businessesById = new Map<
    string,
    { name: string | null; slug: string | null; owner_id: string | null }
  >();
  if (businessIds.size > 0) {
    const { data: businesses } = await admin
      .from("businesses")
      .select("id, name, slug, owner_id")
      .in("id", [...businessIds]);
    for (const b of businesses ?? []) {
      const row = b as {
        id: string;
        name: string | null;
        slug: string | null;
        owner_id: string | null;
      };
      businessesById.set(row.id, {
        name: row.name,
        slug: row.slug,
        owner_id: row.owner_id,
      });
    }
  }

  const newSubmissions = (articles ?? []).map((a) => {
    const row = a as {
      id: string;
      business_id: string;
      title: string;
      slug: string;
      content_type: string;
      submitted_at: string | null;
      created_at: string;
      featured_image_url: string | null;
      excerpt: string | null;
      content: unknown;
      client_industry: string | null;
      challenge: string | null;
      solution: string | null;
      results: string | null;
    };
    const biz = businessesById.get(row.business_id);
    return {
      ...row,
      revisionId: null as string | null,
      isRevisionUpdate: false,
      liveTitle: null as string | null,
      versionNumber: null as number | null,
      businessName: biz?.name ?? null,
      businessSlug: biz?.slug ?? null,
    };
  });

  const revisionUpdates = (revisions ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const articleId = String(row.article_id ?? "");
    const parent = parentArticlesById.get(articleId) ?? null;
    const biz = parent?.business_id ? businessesById.get(parent.business_id) : undefined;
    return {
      id: parent?.id ?? String(row.article_id ?? ""),
      business_id: parent?.business_id ?? "",
      title: String(row.title ?? ""),
      slug: parent?.slug ?? "",
      content_type: String(row.content_type ?? "article"),
      submitted_at: (row.submitted_at as string | null) ?? null,
      created_at: String(row.created_at ?? ""),
      featured_image_url: (row.featured_image_url as string | null) ?? null,
      excerpt: (row.excerpt as string | null) ?? null,
      content: row.content,
      client_industry: (row.client_industry as string | null) ?? null,
      challenge: (row.challenge as string | null) ?? null,
      solution: (row.solution as string | null) ?? null,
      results: (row.results as string | null) ?? null,
      revisionId: String(row.id ?? ""),
      isRevisionUpdate: true,
      liveTitle: parent?.title ?? null,
      versionNumber: Number(row.version_number ?? 0) || null,
      businessName: biz?.name ?? null,
      businessSlug: biz?.slug ?? null,
    };
  });

  const queue = [...newSubmissions, ...revisionUpdates].sort((a, b) => {
    const aTs = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const bTs = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    return aTs - bTs;
  });

  return NextResponse.json({ articles: queue, pendingCount: queue.length });
}
