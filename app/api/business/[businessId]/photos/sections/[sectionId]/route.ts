export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ensureGallerySectionExists } from "@/lib/businessPhotoSectionsSeed";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

/**
 * PATCH — toggle enable, rename a section.
 * Body: { isEnabled?: boolean; title?: string }
 * Built-in sections: only the `services` slug may be renamed (display label;
 * URL segment stays `services`). Other built-ins may only use `isEnabled`.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ businessId: string; sectionId: string }> }
) {
  try {
    const { businessId, sectionId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => null)) as
      | { isEnabled?: unknown; title?: unknown }
      | null;
    if (!body) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: section, error: loadErr } = await ctx.db
      .from("business_photo_sections")
      .select("id, slug, title, is_enabled, is_builtin")
      .eq("id", sectionId)
      .eq("business_id", businessId)
      .maybeSingle();
    if (loadErr) {
      return NextResponse.json({ error: loadErr.message }, { status: 500 });
    }
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const update: { is_enabled?: boolean; title?: string } = {};
    if (typeof body.isEnabled === "boolean") {
      // Free plan can't turn sections off — built-in categories must stay
      // visible on the public page (with an empty-state caption) so the
      // owner is nudged to upgrade and fill them up.
      if (body.isEnabled === false) {
        const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
        const planKey = planByBiz.get(businessId) ?? "free";
        if (planKey === "free") {
          return NextResponse.json(
            {
              error:
                "Upgrade to customize your photo sections. Free plans show all categories.",
            },
            { status: 403 }
          );
        }
      }
      update.is_enabled = body.isEnabled;
    }
    if (typeof body.title === "string") {
      if (
        section.is_builtin &&
        String(section.slug).toLowerCase() !== "services"
      ) {
        return NextResponse.json(
          { error: "Built-in sections can't be renamed." },
          { status: 400 }
        );
      }
      const trimmed = body.title.trim();
      if (!trimmed || trimmed.length > 40) {
        return NextResponse.json(
          { error: "Title must be 1–40 characters." },
          { status: 400 }
        );
      }
      update.title = trimmed;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await ctx.db
      .from("business_photo_sections")
      .update(update)
      .eq("id", sectionId)
      .eq("business_id", businessId)
      .select("id, slug, title, is_enabled, is_builtin, sort_order")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ section: data }, { status: 200 });
  } catch (e) {
    console.error("[section PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE — remove a section. Custom sections: always (paid layout).
 * Built-in sections: Grow+ only; **Gallery** cannot be removed (default album).
 * Photos in the removed section are moved to `gallery`.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ businessId: string; sectionId: string }> }
) {
  try {
    const { businessId, sectionId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const { data: section, error: loadErr } = await ctx.db
      .from("business_photo_sections")
      .select("id, slug, is_builtin")
      .eq("id", sectionId)
      .eq("business_id", businessId)
      .maybeSingle();
    if (loadErr) {
      return NextResponse.json({ error: loadErr.message }, { status: 500 });
    }
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
    const planKey = planByBiz.get(businessId) ?? "free";

    if (String(section.slug).toLowerCase() === "gallery") {
      return NextResponse.json(
        {
          error:
            "Gallery can't be deleted — it's the default album for your profile photos.",
        },
        { status: 400 }
      );
    }

    if (section.is_builtin && planKey === "free") {
      return NextResponse.json(
        {
          error:
            "Built-in categories can't be removed on the Free plan. Upgrade to Grow (or higher) to delete them and use your own sections.",
        },
        { status: 403 }
      );
    }

    await ensureGallerySectionExists(ctx.db, businessId);

    // Reassign any photos in this section to gallery so they aren't orphaned.
    await ctx.db
      .from("business_photos")
      .update({ section: "gallery" })
      .eq("business_id", businessId)
      .eq("section", section.slug);

    const { error } = await ctx.db
      .from("business_photo_sections")
      .delete()
      .eq("id", sectionId)
      .eq("business_id", businessId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[section DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
