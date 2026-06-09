import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { sendArticleRejectedEmail } from "@/lib/articleRejectionEmail";
import { utcBillingMonth } from "@/lib/articles/usage";
import { enforceArticleLinkValidation } from "@/lib/articles/linkValidation/serverEnforce";
import type { ArticleContentDoc } from "@/lib/articles/types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ articleId: string }> };

type ModerateBody = { action?: string; reason?: string | null; revisionId?: string | null };

export async function POST(request: Request, ctx: RouteParams) {
  const { articleId } = await ctx.params;
  if (!UUID_RE.test(String(articleId ?? ""))) {
    return NextResponse.json({ error: "Invalid articleId" }, { status: 400 });
  }

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

  const body = (await request.json().catch(() => ({}))) as ModerateBody;
  const action = String(body.action ?? "").trim().toLowerCase();
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "Invalid action. Expected approve or reject." },
      { status: 400 },
    );
  }

  const reasonRaw = typeof body.reason === "string" ? body.reason.trim() : "";
  if (action === "reject" && !reasonRaw) {
    return NextResponse.json(
      { error: "A rejection reason is required." },
      { status: 400 },
    );
  }

  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/articles/moderate] env", e);
    return NextResponse.json({ error: "Service misconfigured" }, { status: 500 });
  }

  const { data: article, error: fetchErr } = await admin
    .from("articles")
    .select(
      "id, business_id, title, status, submitted_at, slug, excerpt, content, content_type, featured_image_url, client_industry, challenge, solution, results, current_version, active_revision_id, businesses(website)",
    )
    .eq("id", articleId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/articles/moderate] fetch", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const status = String(article.status ?? "");
  const nowIso = new Date().toISOString();
  const revisionId =
    typeof body.revisionId === "string" && UUID_RE.test(body.revisionId.trim())
      ? body.revisionId.trim()
      : null;

  if (revisionId) {
    const { data: revision, error: revErr } = await admin
      .from("article_revisions")
      .select("*")
      .eq("id", revisionId)
      .eq("article_id", articleId)
      .maybeSingle();

    if (revErr) {
      console.error("[admin/articles/moderate] revision fetch", revErr);
      return NextResponse.json({ error: revErr.message }, { status: 500 });
    }
    if (!revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }
    if (String(revision.status) !== "pending_review") {
      return NextResponse.json(
        { error: "Only revisions pending review can be moderated." },
        { status: 409 },
      );
    }
    if (String(article.status) !== "published") {
      return NextResponse.json(
        { error: "Revision moderation requires a published article." },
        { status: 409 },
      );
    }

    const biz = (article as { businesses?: { website?: string | null } | null }).businesses;

    if (action === "approve") {
      const linkCheck = await enforceArticleLinkValidation(admin, {
        businessId: String(article.business_id),
        articleId: String(article.id),
        input: {
          content: (revision.content ?? { type: "doc", content: [] }) as ArticleContentDoc,
          caseStudyFields: {
            clientIndustry: revision.client_industry,
            challenge: revision.challenge,
            solution: revision.solution,
            results: revision.results,
          },
          businessWebsite: biz?.website ?? null,
        },
      });
      if (!linkCheck.ok) {
        await admin.from("article_validation_logs").insert(
          linkCheck.result.issues.map((item) => ({
            article_id: articleId,
            business_id: article.business_id,
            validation_type: item.code,
            message: item.message,
          })),
        );
        return NextResponse.json(
          { error: linkCheck.message, issues: linkCheck.result.issues },
          { status: 400 },
        );
      }

      const { data: updatedArticle, error: articleUpdErr } = await admin
        .from("articles")
        .update({
          title: revision.title,
          excerpt: revision.excerpt,
          content: revision.content,
          content_type: revision.content_type,
          featured_image_url: revision.featured_image_url,
          client_industry: revision.client_industry,
          challenge: revision.challenge,
          solution: revision.solution,
          results: revision.results,
          author_name: revision.author_name,
          author_title: revision.author_title,
          author_bio: revision.author_bio,
          author_avatar_url: revision.author_avatar_url,
          meta_title: revision.meta_title,
          meta_description: revision.meta_description,
          featured_image_alt: revision.featured_image_alt,
          featured_image_width: revision.featured_image_width,
          featured_image_height: revision.featured_image_height,
          key_takeaways: revision.key_takeaways,
          faq: revision.faq,
          tags: revision.tags,
          primary_keyword: revision.primary_keyword,
          target_audience: revision.target_audience,
          content_goal: revision.content_goal,
          current_version: revision.version_number,
          active_revision_id: null,
          reviewed_at: nowIso,
          reviewed_by: user.id,
          rejection_reason: null,
          updated_at: nowIso,
        })
        .eq("id", articleId)
        .select("*")
        .maybeSingle();

      if (articleUpdErr) {
        console.error("[admin/articles/moderate] revision approve article", articleUpdErr);
        return NextResponse.json({ error: articleUpdErr.message }, { status: 500 });
      }

      const { data: updatedRevision, error: revUpdErr } = await admin
        .from("article_revisions")
        .update({
          status: "approved",
          reviewed_at: nowIso,
          reviewed_by: user.id,
          rejection_reason: null,
        })
        .eq("id", revisionId)
        .select("*")
        .maybeSingle();

      if (revUpdErr) {
        console.error("[admin/articles/moderate] revision approve revision", revUpdErr);
        return NextResponse.json({ error: revUpdErr.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        action,
        article: updatedArticle,
        revision: updatedRevision,
        emailStatus: "skipped",
      });
    }

    const { data: updatedRevision, error: revRejectErr } = await admin
      .from("article_revisions")
      .update({
        status: "rejected",
        rejection_reason: reasonRaw,
        reviewed_at: nowIso,
        reviewed_by: user.id,
      })
      .eq("id", revisionId)
      .select("*")
      .maybeSingle();

    if (revRejectErr) {
      console.error("[admin/articles/moderate] revision reject", revRejectErr);
      return NextResponse.json({ error: revRejectErr.message }, { status: 500 });
    }

    let emailStatus: "sent" | "skipped" | "no_owner_email" = "skipped";
    try {
      const { data: bizRow } = await admin
        .from("businesses")
        .select("name, owner_id")
        .eq("id", article.business_id)
        .maybeSingle();

      let ownerEmail: string | null = null;
      let ownerName: string | null = null;
      if (bizRow?.owner_id) {
        const { data: owner } = await admin
          .from("profiles")
          .select("email, display_name, full_name")
          .eq("id", bizRow.owner_id)
          .maybeSingle();
        ownerEmail = owner?.email?.trim() || null;
        ownerName = owner?.display_name?.trim() || owner?.full_name?.trim() || null;
      }

      if (ownerEmail) {
        await sendArticleRejectedEmail({
          toEmail: ownerEmail,
          ownerName,
          businessName: bizRow?.name ?? null,
          articleTitle: revision.title,
          moderationReason: reasonRaw,
          articleId: article.id,
        });
        emailStatus = "sent";
      } else {
        emailStatus = "no_owner_email";
      }
    } catch (e) {
      console.error("[admin/articles/moderate] revision reject email", e);
    }

    return NextResponse.json({
      ok: true,
      action,
      article,
      revision: updatedRevision,
      emailStatus,
    });
  }

  if (action === "approve") {
    if (status !== "pending_review") {
      return NextResponse.json(
        { error: "Only articles pending review can be approved." },
        { status: 409 },
      );
    }

    const biz = (article as { businesses?: { website?: string | null } | null }).businesses;
    const linkCheck = await enforceArticleLinkValidation(admin, {
      businessId: String(article.business_id),
      articleId: String(article.id),
      input: {
        content: (article.content ?? { type: "doc", content: [] }) as ArticleContentDoc,
        caseStudyFields: {
          clientIndustry: article.client_industry,
          challenge: article.challenge,
          solution: article.solution,
          results: article.results,
        },
        businessWebsite: biz?.website ?? null,
      },
    });
    if (!linkCheck.ok) {
      await admin.from("article_validation_logs").insert(
        linkCheck.result.issues.map((item) => ({
          article_id: articleId,
          business_id: article.business_id,
          validation_type: item.code,
          message: item.message,
        })),
      );
      return NextResponse.json({ error: linkCheck.message, issues: linkCheck.result.issues }, { status: 400 });
    }

    const { data: updated, error: updErr } = await admin
      .from("articles")
      .update({
        status: "published",
        published_at: nowIso,
        reviewed_at: nowIso,
        reviewed_by: user.id,
        rejection_reason: null,
      })
      .eq("id", articleId)
      .select("*")
      .maybeSingle();

    if (updErr) {
      console.error("[admin/articles/moderate] approve", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action, article: updated, emailStatus: "skipped" });
  }

  if (status !== "pending_review" && status !== "published") {
    return NextResponse.json(
      { error: "Only pending or published articles can be rejected." },
      { status: 409 },
    );
  }

  const wasPending = status === "pending_review";

  const { data: updated, error: updErr } = await admin
    .from("articles")
    .update({
      status: "rejected",
      rejection_reason: reasonRaw,
      reviewed_at: nowIso,
      reviewed_by: user.id,
      published_at: null,
    })
    .eq("id", articleId)
    .select("*")
    .maybeSingle();

  if (updErr) {
    console.error("[admin/articles/moderate] reject", updErr);
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  if (wasPending) {
    const billingMonth = utcBillingMonth(
      article.submitted_at ? new Date(article.submitted_at) : new Date(),
    );
    await admin.rpc("return_article_credit", {
      p_business_id: article.business_id,
      p_billing_month: billingMonth,
    });
  }

  let emailStatus: "sent" | "skipped" | "no_owner_email" = "skipped";
  try {
    const { data: biz } = await admin
      .from("businesses")
      .select("name, owner_id")
      .eq("id", article.business_id)
      .maybeSingle();

    let ownerEmail: string | null = null;
    let ownerName: string | null = null;
    if (biz?.owner_id) {
      const { data: owner } = await admin
        .from("profiles")
        .select("email, display_name, full_name")
        .eq("id", biz.owner_id)
        .maybeSingle();
      ownerEmail = owner?.email?.trim() || null;
      ownerName = owner?.display_name?.trim() || owner?.full_name?.trim() || null;
    }

    if (ownerEmail) {
      await sendArticleRejectedEmail({
        toEmail: ownerEmail,
        ownerName,
        businessName: biz?.name ?? null,
        articleTitle: article.title,
        moderationReason: reasonRaw,
        articleId: article.id,
      });
      emailStatus = "sent";
    } else {
      emailStatus = "no_owner_email";
    }
  } catch (e) {
    console.error("[admin/articles/moderate] email", e);
  }

  return NextResponse.json({
    ok: true,
    action,
    article: updated,
    emailStatus,
  });
}
