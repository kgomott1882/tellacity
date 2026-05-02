export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  FREE_PLAN_EXCLUSIVE_UPLOAD_CODE,
  evaluateFreePlanExclusiveUpload,
  photoLimitMessageForPlan,
} from "@/lib/photoUploadFreeLimit";
import {
  PLAN_PHOTO_LIMITS,
  getActivePlanKeysByBusinessIds,
} from "@/lib/plans";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

/** Public object URLs must include this path segment (client uploads to `business_media` only). */
const STORAGE_PUBLIC_URL_MARKER = "/storage/v1/object/public/business_media/" as const;

function sanitizeSectionSlug(raw: unknown): string {
  if (typeof raw !== "string") return "gallery";
  const s = raw.toLowerCase().trim();
  return s || "gallery";
}

function parseUploadBatchId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRe.test(s) ? s : null;
}

function parseUrl(body: Record<string, unknown> | null): string | NextResponse {
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (!url.includes(STORAGE_PUBLIC_URL_MARKER)) {
    return NextResponse.json({ error: "Invalid image source" }, { status: 400 });
  }
  return url;
}

/**
 * Register a business photo after the client uploads to storage (same url contract as before).
 * Body: JSON { url: string, section?: string, uploadBatchId?: string (uuid) }.
 * Unknown / empty / invalid section → gallery. Optional uploadBatchId groups
 * multi-file uploads for batch labeling (see /photos/batch-label).
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

    const urlResult = parseUrl(body);
    if (urlResult instanceof NextResponse) return urlResult;
    const url = urlResult;

    const section = sanitizeSectionSlug(body?.section);
    const uploadBatchId = parseUploadBatchId(body?.uploadBatchId);

    // Every target slug must have a row (including former “built-ins” a paid
    // owner removed — uploads to those slugs are rejected until they add a
    // section again or pick an existing one).
    const { data: sectionRow } = await ctx.db
      .from("business_photo_sections")
      .select("id, is_enabled")
      .eq("business_id", businessId)
      .eq("slug", section)
      .maybeSingle();
    if (!sectionRow || sectionRow.is_enabled === false) {
      return NextResponse.json(
        { error: "That section doesn't exist for this business." },
        { status: 400 }
      );
    }

    const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
    const planKey = planByBiz.get(businessId) ?? "free";

    const { data: existingSectionRows, error: existingSecErr } = await ctx.db
      .from("business_photos")
      .select("section")
      .eq("business_id", businessId);
    if (existingSecErr) {
      console.error("[photos/upload] existing sections", existingSecErr.message);
      return NextResponse.json({ error: "Could not verify photo sections." }, { status: 500 });
    }

    const exclusiveGate = evaluateFreePlanExclusiveUpload(
      planKey,
      section,
      existingSectionRows ?? []
    );
    if (exclusiveGate.blocked) {
      return NextResponse.json(
        {
          error: exclusiveGate.message,
          code: FREE_PLAN_EXCLUSIVE_UPLOAD_CODE,
          planKey,
          section,
        },
        { status: 403 }
      );
    }

    // Note: the old 30-day post-publish upload cooldown has been removed.
    // Free users can now use every slot up to their plan cap at any time;
    // the 30-day lock only applies to editing / deleting *already
    // published* photos (see isPhotoEditLocked in the PATCH / DELETE
    // route). The cap check below is the only remaining gate on new
    // uploads.

    // Enforce the total per-plan photo cap (Free: also single-category rule above).
    const planCap = PLAN_PHOTO_LIMITS[planKey] ?? PLAN_PHOTO_LIMITS.free;
    const { data: existingRows, error: countErr } = await ctx.db
      .from("business_photos")
      .select("id")
      .eq("business_id", businessId)
      .limit(planCap);

    if (countErr) {
      console.error(
        "[photos/upload] count",
        JSON.stringify(
          {
            message: countErr.message,
            code: countErr.code,
            details: countErr.details,
            hint: countErr.hint,
          },
          null,
          2
        )
      );
      return NextResponse.json({ error: "Could not verify photo limit." }, { status: 500 });
    }
    if ((existingRows?.length ?? 0) >= planCap) {
      return NextResponse.json(
        { error: photoLimitMessageForPlan(planKey), planKey, cap: planCap },
        { status: 403 }
      );
    }

    // Always insert as draft — publishing is a deliberate, separate action.
    const insertRow: Record<string, unknown> = {
      business_id: businessId,
      url,
      section,
      created_by: ctx.userId,
      status: "draft",
    };
    if (uploadBatchId) insertRow.upload_batch_id = uploadBatchId;

    const { data, error } = await ctx.db
      .from("business_photos")
      .insert(insertRow)
      .select("id, business_id, url, section, status, created_at, upload_batch_id, upload_batch_label")
      .single();

    if (error) {
      console.error(
        "[photos/upload] insert",
        JSON.stringify(
          {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
          null,
          2
        )
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photo: data }, { status: 201 });
  } catch (e) {
    console.error("[photos/upload]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
