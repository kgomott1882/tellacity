import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import { capBusinessPhotosForPublicDisplay } from "@/lib/businessPhotosPublicCap";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";
import { getActivePlanKeyForBusiness } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";

const PUBLIC_PHOTO_SELECT_FULL =
  "id, url, section, created_at, is_cover, sort_order, status, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url";

const PUBLIC_PHOTO_SELECT_FALLBACK =
  "id, url, section, created_at, is_cover, sort_order, status";

type PhotoRow = Record<string, unknown>;

export function createPlanResolutionAdminClient(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mapBusinessPhotoRowToPublic(row: PhotoRow): BusinessPhotoPublic | null {
  const id = String(row.id ?? "");
  const url = String(row.url ?? "");
  if (!id || !url) return null;

  return {
    id,
    url,
    section: String(row.section ?? "gallery"),
    sort_order: Number(row.sort_order) || 0,
    created_at: (row.created_at as string | null | undefined) ?? null,
    is_cover: row.is_cover === true,
    preview_zoom: Number(row.preview_zoom) || 1,
    preview_x: Number(row.preview_x) || 50,
    preview_y: Number(row.preview_y) || 50,
    preview_frame:
      String(row.preview_frame ?? "landscape") === "portrait"
        ? ("portrait" as const)
        : ("landscape" as const),
    product_name: (row.product_name as string | null | undefined) ?? null,
    product_description: (row.product_description as string | null | undefined) ?? null,
    product_price:
      typeof row.product_price === "number"
        ? (row.product_price as number)
        : null,
    product_currency: (() => {
      const c = row.product_currency;
      if (typeof c === "string" && c.trim()) return c.trim().toUpperCase().slice(0, 3);
      return "USD";
    })(),
    product_redirect_url: (() => {
      const u = row.product_redirect_url;
      if (typeof u === "string" && u.trim()) return u.trim();
      return null;
    })(),
  };
}

/** Published + live rows in canonical profile order (uncapped). */
export async function loadOrderedPublishedLiveBusinessPhotos(
  supabase: SupabaseClient,
  businessId: string,
): Promise<BusinessPhotoPublic[]> {
  const primaryPhotosRes = await applyBusinessPhotosOrdering(
    supabase
      .from("business_photos")
      .select(PUBLIC_PHOTO_SELECT_FULL)
      .eq("business_id", businessId)
      .eq("status", "published")
      .eq("is_live", true),
  );

  const { data: businessPhotosRows } = primaryPhotosRes.error
    ? await applyBusinessPhotosOrdering(
        supabase
          .from("business_photos")
          .select(PUBLIC_PHOTO_SELECT_FALLBACK)
          .eq("business_id", businessId)
          .eq("status", "published")
          .eq("is_live", true),
      )
    : primaryPhotosRes;

  return (businessPhotosRows ?? [])
    .map((row) => mapBusinessPhotoRowToPublic(row as PhotoRow))
    .filter((p): p is BusinessPhotoPublic => p != null);
}

/**
 * Public profile photos: canonical order, capped to reconciled plan limit.
 * Uses service role for plan resolution (trial expiry → free, etc.).
 */
export async function loadPublicBusinessPhotosForDisplay(opts: {
  supabase: SupabaseClient;
  planAdmin: SupabaseClient;
  businessId: string;
}): Promise<BusinessPhotoPublic[]> {
  const ordered = await loadOrderedPublishedLiveBusinessPhotos(opts.supabase, opts.businessId);
  const plan = await getActivePlanKeyForBusiness(opts.businessId, opts.planAdmin);
  return capBusinessPhotosForPublicDisplay(ordered, plan);
}

/** Whether a published live photo is within the public display cap for the current plan. */
export async function isPublishedPhotoWithinPublicDisplayCap(opts: {
  supabase: SupabaseClient;
  planAdmin: SupabaseClient;
  businessId: string;
  photoId: string;
}): Promise<boolean> {
  const visible = await loadPublicBusinessPhotosForDisplay(opts);
  return visible.some((p) => p.id === opts.photoId);
}
