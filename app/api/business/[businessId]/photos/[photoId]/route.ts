export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  FREE_PLAN_PUBLISH_LOCK_MESSAGE,
  computePublishLockStatus,
  isPhotoEditLocked,
} from "@/lib/businessPhotoLock";

const STORAGE_BUCKET = "business_media";
const STORAGE_PUBLIC_URL_MARKER = "/storage/v1/object/public/" as const;

function sanitizeSlug(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.toLowerCase().trim();
}

/**
 * Build the standard 423 response for a locked edit attempt on Free.
 */
function publishLockResponse(lastPublishedAt: string | null) {
  const lock = computePublishLockStatus("free", lastPublishedAt);
  return NextResponse.json(
    { error: FREE_PLAN_PUBLISH_LOCK_MESSAGE, lock },
    { status: 423 }
  );
}

type PhotoRow = {
  id: string;
  business_id: string;
  section: string | null;
  is_cover: boolean | null;
  status: string | null;
  published_at: string | null;
  url?: string | null;
};

/**
 * PATCH — update a single photo: set cover, move to a different section.
 * Body: { isCover?: boolean; section?: string }
 *
 * On Free, a published photo is locked for 30 days after it was published.
 * While locked, both cover changes and section moves return 423. Drafts
 * remain fully editable regardless of plan.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ businessId: string; photoId: string }> }
) {
  try {
    const { businessId, photoId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => null)) as
      | { isCover?: unknown; section?: unknown }
      | null;
    if (!body || (body.isCover === undefined && body.section === undefined)) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: photoRaw, error: photoErr } = await ctx.db
      .from("business_photos")
      .select("id, business_id, section, is_cover, status, published_at")
      .eq("id", photoId)
      .eq("business_id", businessId)
      .maybeSingle();
    if (photoErr) {
      return NextResponse.json({ error: photoErr.message }, { status: 500 });
    }
    const photo = photoRaw as PhotoRow | null;
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
    const planKey = planByBiz.get(businessId) ?? "free";
    if (isPhotoEditLocked(planKey, photo.status, photo.published_at)) {
      return publishLockResponse(photo.published_at);
    }

    // Set cover — flip this photo to cover and clear the previous cover.
    if (body.isCover === true) {
      const { error: clearErr } = await ctx.db
        .from("business_photos")
        .update({ is_cover: false })
        .eq("business_id", businessId)
        .eq("is_cover", true)
        .neq("id", photoId);
      if (clearErr) {
        return NextResponse.json({ error: clearErr.message }, { status: 500 });
      }
      const { error: setErr } = await ctx.db
        .from("business_photos")
        .update({ is_cover: true })
        .eq("id", photoId);
      if (setErr) {
        return NextResponse.json({ error: setErr.message }, { status: 500 });
      }
    } else if (body.isCover === false) {
      const { error } = await ctx.db
        .from("business_photos")
        .update({ is_cover: false })
        .eq("id", photoId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Move to a different section (slug must exist and be enabled).
    if (typeof body.section === "string") {
      const slug = sanitizeSlug(body.section);
      if (!slug) {
        return NextResponse.json({ error: "Invalid section" }, { status: 400 });
      }
      const { data: sectionRow } = await ctx.db
        .from("business_photo_sections")
        .select("id, is_enabled")
        .eq("business_id", businessId)
        .eq("slug", slug)
        .maybeSingle();
      if (!sectionRow || sectionRow.is_enabled === false) {
        return NextResponse.json(
          { error: "That section doesn't exist for this business." },
          { status: 400 }
        );
      }

      const { error } = await ctx.db
        .from("business_photos")
        .update({ section: slug })
        .eq("id", photoId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { data: refreshed } = await ctx.db
      .from("business_photos")
      .select("id, business_id, url, section, status, is_cover, sort_order, created_at, published_at")
      .eq("id", photoId)
      .maybeSingle();

    return NextResponse.json({ photo: refreshed }, { status: 200 });
  } catch (e) {
    console.error("[photos PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE — remove a photo (row + storage object).
 * On Free, a published photo is locked for 30 days after publish.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ businessId: string; photoId: string }> }
) {
  try {
    const { businessId, photoId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const { data: photoRaw, error: photoErr } = await ctx.db
      .from("business_photos")
      .select("id, url, business_id, status, published_at")
      .eq("id", photoId)
      .eq("business_id", businessId)
      .maybeSingle();
    if (photoErr) {
      return NextResponse.json({ error: photoErr.message }, { status: 500 });
    }
    const photo = photoRaw as PhotoRow | null;
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
    const planKey = planByBiz.get(businessId) ?? "free";
    if (isPhotoEditLocked(planKey, photo.status, photo.published_at)) {
      return publishLockResponse(photo.published_at);
    }

    const { error: delErr } = await ctx.db
      .from("business_photos")
      .delete()
      .eq("id", photoId)
      .eq("business_id", businessId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Best-effort: remove the storage object. Failures here are not fatal.
    try {
      const marker = `${STORAGE_PUBLIC_URL_MARKER}${STORAGE_BUCKET}/`;
      const url = typeof photo.url === "string" ? photo.url : "";
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const path = decodeURIComponent(url.slice(idx + marker.length).split("?")[0] ?? "");
        if (path) {
          await ctx.db.storage.from(STORAGE_BUCKET).remove([path]);
        }
      }
    } catch (storageErr) {
      console.warn("[photos DELETE] storage cleanup failed", storageErr);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[photos DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
