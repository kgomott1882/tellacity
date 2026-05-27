export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  FREE_PLAN_PUBLISH_LOCK_MESSAGE,
  computePublishLockStatus,
  isPhotoEditLocked,
} from "@/lib/businessPhotoLock";
import { sanitizeProductCurrencyCode } from "@/lib/productCurrency";

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
  preview_zoom?: number | null;
  preview_x?: number | null;
  preview_y?: number | null;
  preview_frame?: string | null;
  product_name?: string | null;
  product_description?: string | null;
  product_price?: number | null;
  product_currency?: string | null;
  product_redirect_url?: string | null;
  url?: string | null;
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function cleanOptionalText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  return s.slice(0, maxLen);
}

const MAX_PRODUCT_REDIRECT_URL = 2000;

function cleanProductRedirectUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  return s.slice(0, MAX_PRODUCT_REDIRECT_URL);
}

/**
 * PATCH, update a single photo: set cover, move section, preview mode, product metadata.
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
      | {
          isCover?: unknown;
          section?: unknown;
          preview?: {
            zoom?: unknown;
            x?: unknown;
            y?: unknown;
            frame?: unknown;
          };
          product?: {
            name?: unknown;
            description?: unknown;
            price?: unknown;
            currency?: unknown;
            redirect_url?: unknown;
          };
        }
      | null;
    if (
      !body ||
      (body.isCover === undefined &&
        body.section === undefined &&
        body.preview === undefined &&
        body.product === undefined)
    ) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: photoRaw, error: photoErr } = await ctx.db
      .from("business_photos")
      .select("id, business_id, section, is_cover, status, published_at, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url")
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
    const touchesLockedFields =
      body.isCover !== undefined || typeof body.section === "string";
    if (touchesLockedFields && isPhotoEditLocked(planKey, photo.status, photo.published_at)) {
      return publishLockResponse(photo.published_at);
    }

    // Set cover, flip this photo to cover and clear the previous cover.
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

    if (body.preview && typeof body.preview === "object") {
      const frameRaw = String(body.preview.frame ?? "").trim().toLowerCase();
      const frame =
        frameRaw === "portrait" || frameRaw === "landscape"
          ? frameRaw
          : (photo.preview_frame ?? "landscape");
      const zoom = clampNumber(body.preview.zoom, 1, 2.5, photo.preview_zoom ?? 1);
      const x = clampNumber(body.preview.x, 0, 100, photo.preview_x ?? 50);
      const y = clampNumber(body.preview.y, 0, 100, photo.preview_y ?? 50);
      const { error } = await ctx.db
        .from("business_photos")
        .update({
          preview_zoom: zoom,
          preview_x: x,
          preview_y: y,
          preview_frame: frame,
        })
        .eq("id", photoId);
      if (error) {
        if (error.code === "42703") {
          return NextResponse.json(
            {
              error:
                "Preview controls are not enabled yet. Run the latest Supabase migration for business_photos preview columns.",
              code: "PREVIEW_COLUMNS_MISSING",
            },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (body.product && typeof body.product === "object") {
      const productName = cleanOptionalText(body.product.name, 80);
      const productDescription = cleanOptionalText(body.product.description, 280);
      const rawPrice = body.product.price;
      const parsedPrice =
        rawPrice === null || rawPrice === undefined || rawPrice === ""
          ? null
          : Number(rawPrice);
      const productPrice =
        parsedPrice === null || Number.isNaN(parsedPrice)
          ? null
          : Math.max(0, Math.min(9999999999.99, parsedPrice));
      const productCurrency = sanitizeProductCurrencyCode(body.product.currency);
      const productRedirectUrl = cleanProductRedirectUrl(body.product.redirect_url);
      const { error } = await ctx.db
        .from("business_photos")
        .update({
          product_name: productName,
          product_description: productDescription,
          product_price: productPrice,
          product_currency: productCurrency,
          product_redirect_url: productRedirectUrl,
        })
        .eq("id", photoId);
      if (error) {
        if (error.code === "42703") {
          return NextResponse.json(
            {
              error:
                "Product metadata columns are missing. Run the latest Supabase migration for business_photos product fields.",
              code: "PRODUCT_COLUMNS_MISSING",
            },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { data: refreshed } = await ctx.db
      .from("business_photos")
      .select("id, business_id, url, section, status, is_cover, sort_order, created_at, published_at, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url")
      .eq("id", photoId)
      .maybeSingle();

    return NextResponse.json({ photo: refreshed }, { status: 200 });
  } catch (e) {
    console.error("[photos PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE, remove a photo (row + storage object).
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

    // Must run before deleting the photo: FK is ON DELETE SET NULL in older DBs, which
    // can produce duplicate (business, email) “general” drafts under partial uniques.
    // Service role: review_drafts has no owner-facing RLS delete path.
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: draftDelErr } = await admin
      .from("review_drafts")
      .delete()
      .eq("product_photo_id", photoId)
      .eq("business_id", businessId);
    if (draftDelErr) {
      return NextResponse.json({ error: draftDelErr.message }, { status: 500 });
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
