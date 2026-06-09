export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { UUID_RE, jsonError } from "../../_shared";

type RouteParams = {
  params: Promise<{ businessId: string; articleId: string }>;
};

export async function GET(req: Request, ctx: RouteParams) {
  const { businessId, articleId } = await ctx.params;
  if (!UUID_RE.test(businessId) || !UUID_RE.test(articleId)) {
    return jsonError("Invalid id");
  }

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const { data: article, error: articleErr } = await access.db
    .from("articles")
    .select("id")
    .eq("business_id", businessId)
    .eq("id", articleId)
    .maybeSingle();

  if (articleErr) {
    return NextResponse.json({ error: articleErr.message }, { status: 500 });
  }
  if (!article) return jsonError("Article not found", 404);

  const { data: business, error: bizErr } = await access.db
    .from("businesses")
    .select(
      "id, name, slug, canonical_slug, logo_url, website, category_slug, description, city, country_code, address",
    )
    .eq("id", businessId)
    .maybeSingle();

  if (bizErr) {
    return NextResponse.json({ error: bizErr.message }, { status: 500 });
  }
  if (!business) return jsonError("Business not found", 404);

  const { data: metrics } = await access.db
    .from("business_review_metrics_v")
    .select("average_rating, review_count")
    .eq("business_id", businessId)
    .maybeSingle();

  const profileSlug = String(business.canonical_slug ?? business.slug ?? "");

  return NextResponse.json({
    business: {
      id: business.id,
      name: business.name,
      profileSlug,
      logoUrl: business.logo_url,
      website: business.website,
      categorySlug: business.category_slug,
      description: business.description,
      city: business.city,
      countryCode: business.country_code,
      address: business.address,
    },
    metrics: {
      averageRating: Number((metrics as { average_rating?: number } | null)?.average_rating ?? 0),
      reviewCount: Number((metrics as { review_count?: number } | null)?.review_count ?? 0),
    },
  });
}
