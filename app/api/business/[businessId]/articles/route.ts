export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { requireArticleWriteAccess } from "@/lib/articles/access";
import {
  emptyArticleDoc,
  plainTextFromDoc,
  sanitizeArticleContent,
} from "@/lib/articles/sanitize";
import { allocateArticleSlug } from "@/lib/articles/articleSlugServer";
import { UUID_RE, jsonError, parseContentType } from "./_shared";

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: Request, ctx: RouteParams) {
  const { businessId } = await ctx.params;
  if (!UUID_RE.test(businessId)) return jsonError("Invalid business id");

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim();

  let query = access.db
    .from("articles")
    .select(
      "id, title, slug, excerpt, content_type, featured_image_url, status, published_at, submitted_at, archived_at, rejection_reason, created_at, updated_at, client_industry, current_version, active_revision_id",
    )
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (status && status !== "pending_review") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[articles GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const revisionIds = rows
    .map((r) => (r as { active_revision_id?: string | null }).active_revision_id)
    .filter((id): id is string => Boolean(id));

  const revisionsById = new Map<string, Record<string, unknown>>();
  if (revisionIds.length > 0) {
    const { data: revisions } = await access.db
      .from("article_revisions")
      .select(
        "id, status, version_number, submitted_at, rejection_reason, updated_at, featured_image_url",
      )
      .in("id", revisionIds);
    for (const rev of revisions ?? []) {
      revisionsById.set(String((rev as { id: string }).id), rev as Record<string, unknown>);
    }
  }

  const articles = rows.map((row) => {
    const activeRevisionId = (row as { active_revision_id?: string | null }).active_revision_id;
    const activeRevision = activeRevisionId
      ? revisionsById.get(activeRevisionId) ?? null
      : null;
    return { ...row, active_revision: activeRevision };
  });

  const filtered =
    status === "pending_review"
      ? articles.filter((row) => {
          const r = row as {
            status?: string;
            active_revision?: { status?: string } | null;
          };
          return (
            r.status === "pending_review" ||
            r.active_revision?.status === "pending_review"
          );
        })
      : articles;

  return NextResponse.json({ articles: filtered });
}

export async function POST(req: Request, ctx: RouteParams) {
  const { businessId } = await ctx.params;
  if (!UUID_RE.test(businessId)) return jsonError("Invalid business id");

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const write = await requireArticleWriteAccess(access.db, access.userId, businessId);
  if (!write.ok) return jsonError(write.message, 403);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const contentType = parseContentType(body?.contentType ?? body?.content_type) ?? "article";
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  let slug: string;
  try {
    slug = await allocateArticleSlug({ title });
  } catch (slugErr) {
    console.error("[articles POST] slug allocation", slugErr);
    return jsonError("Could not allocate article slug", 500);
  }

  const content = sanitizeArticleContent(body?.content ?? emptyArticleDoc());
  const excerpt =
    typeof body?.excerpt === "string" && body.excerpt.trim()
      ? body.excerpt.trim().slice(0, 500)
      : plainTextFromDoc(content, 280);

  const insert: Record<string, unknown> = {
    business_id: businessId,
    author_user_id: access.userId,
    title: title || "Untitled draft",
    slug,
    excerpt,
    content,
    content_type: contentType,
    status: "draft",
  };

  if (contentType === "case_study") {
    insert.client_industry =
      typeof body?.clientIndustry === "string" ? body.clientIndustry.trim().slice(0, 200) : null;
    insert.challenge =
      typeof body?.challenge === "string" ? body.challenge.trim().slice(0, 5000) : null;
    insert.solution =
      typeof body?.solution === "string" ? body.solution.trim().slice(0, 5000) : null;
    insert.results =
      typeof body?.results === "string" ? body.results.trim().slice(0, 5000) : null;
  }

  const { data, error } = await access.db
    .from("articles")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    console.error("[articles POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ article: data }, { status: 201 });
}
