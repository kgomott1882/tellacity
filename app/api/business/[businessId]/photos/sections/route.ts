export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { seedMissingBusinessPhotoSections } from "@/lib/businessPhotoSectionsSeed";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** GET — list sections for this business (auto-seeds defaults when missing). */
export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
    const planKey = planByBiz.get(businessId) ?? "free";
    await seedMissingBusinessPhotoSections(ctx.db, businessId, planKey);

    const { data, error } = await ctx.db
      .from("business_photo_sections")
      .select("id, slug, title, is_enabled, is_builtin, sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sections: data ?? [] }, { status: 200 });
  } catch (e) {
    console.error("[sections GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST — create a custom section. Body: { title: string } */
export async function POST(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => null)) as { title?: unknown } | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 40) {
      return NextResponse.json({ error: "Title must be 1–40 characters." }, { status: 400 });
    }
    const slug = slugify(title);
    if (!slug) {
      return NextResponse.json(
        { error: "Title must include letters or numbers." },
        { status: 400 }
      );
    }

    // Auto-compute sort_order to put it after all existing.
    const { data: last } = await ctx.db
      .from("business_photo_sections")
      .select("sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSortOrder = ((last?.sort_order as number | undefined) ?? 50) + 10;

    const { data, error } = await ctx.db
      .from("business_photo_sections")
      .insert({
        business_id: businessId,
        slug,
        title,
        is_builtin: false,
        is_enabled: true,
        sort_order: nextSortOrder,
      })
      .select("id, slug, title, is_enabled, is_builtin, sort_order")
      .single();

    if (error) {
      // Most likely: unique (business_id, slug) conflict.
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A section with that title already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ section: data }, { status: 201 });
  } catch (e) {
    console.error("[sections POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
