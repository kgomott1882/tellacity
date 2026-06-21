export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import {
  createPlanResolutionAdminClient,
  isPublishedPhotoWithinPublicDisplayCap,
} from "@/lib/loadPublicBusinessPhotos";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * GET /api/reviews/item-context?businessSlug=…&photoId=…
 * Public when the photo is published + live; otherwise requires business dashboard session (draft preview).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = (url.searchParams.get("businessSlug") || url.searchParams.get("slug") || "")
      .trim()
      .toLowerCase();
    const photoId = (url.searchParams.get("photoId") || "").trim();
    if (!slug || !isUuid(photoId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: biz, error: bizErr } = await admin
      .from("businesses")
      .select("id,name,slug")
      .eq("slug", slug)
      .maybeSingle();
    if (bizErr || !biz?.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: photo, error: photoErr } = await admin
      .from("business_photos")
      .select(
        "id,url,section,status,is_live,product_name,product_description,product_price,product_currency"
      )
      .eq("id", photoId)
      .eq("business_id", biz.id)
      .maybeSingle();

    if (photoErr || !photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const status = String(photo.status ?? "").toLowerCase();
    const live = photo.is_live !== false;
    const publishedOk = status === "published" && live;
    let withinPublicCap = true;

    if (!publishedOk) {
      const dash = await requireBusinessAccess(req, biz.id);
      if (!dash.ok) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } else {
      const planAdmin = createPlanResolutionAdminClient();
      withinPublicCap = await isPublishedPhotoWithinPublicDisplayCap({
        supabase: admin,
        planAdmin,
        businessId: biz.id,
        photoId,
      });
      if (!withinPublicCap) {
        const dash = await requireBusinessAccess(req, biz.id);
        if (!dash.ok) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      }
    }

    const itemName =
      (typeof photo.product_name === "string" && photo.product_name.trim()) ||
      (String(photo.section ?? "") === "products" ? "Product" : "Photo");

    const productCodeRaw =
      typeof photo.product_description === "string" ? photo.product_description.trim() : "";
    const productCode = productCodeRaw.length > 0 ? productCodeRaw : null;

    return NextResponse.json(
      {
        business: {
          id: biz.id,
          name: String(biz.name ?? ""),
          slug: String(biz.slug ?? slug),
        },
        item: {
          photoId: String(photo.id),
          name: itemName,
          productCode,
          price:
            typeof photo.product_price === "number" && Number.isFinite(photo.product_price)
              ? photo.product_price
              : null,
          currency:
            typeof photo.product_currency === "string" && photo.product_currency.trim()
              ? photo.product_currency.trim().toUpperCase().slice(0, 3)
              : "USD",
          imageUrl: typeof photo.url === "string" ? photo.url : null,
          section: String(photo.section ?? ""),
        },
        /** Linked item reviews require a published, live photo within the public display cap. */
        canSubmitItemReview: publishedOk && withinPublicCap,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[item-context GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
