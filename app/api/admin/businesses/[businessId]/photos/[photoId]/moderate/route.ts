import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { sendPhotoRejectedEmail } from "@/lib/businessPhotoModerationEmail";

/**
 * POST /api/admin/businesses/:businessId/photos/:photoId/moderate
 *
 * Body: { action: "approve" | "reject" | "flag" | "reset", reason?: string }
 *
 * Writes the moderation decision to `business_photos` and, on reject , 
 * fires an email to the business owner explaining the rejection. The
 * database row is the source of truth: email failure does NOT roll back
 * the moderation decision.
 */
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = {
  params: Promise<{ businessId: string; photoId: string }>;
};

type ModerateAction = "approve" | "reject" | "flag" | "reset";

type ModerateBody = {
  action?: string;
  reason?: string | null;
};

function normalizeAction(raw: unknown): ModerateAction | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "approve" || v === "reject" || v === "flag" || v === "reset") {
    return v;
  }
  return null;
}

export async function POST(request: Request, ctx: RouteParams) {
  const { businessId, photoId } = await ctx.params;
  if (!UUID_RE.test(String(businessId ?? ""))) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }
  if (!UUID_RE.test(String(photoId ?? ""))) {
    return NextResponse.json({ error: "Invalid photoId" }, { status: 400 });
  }

  // --- admin auth gate -----------------------------------------------------
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

  // --- body ----------------------------------------------------------------
  const body = (await request.json().catch(() => ({}))) as ModerateBody;
  const action = normalizeAction(body.action);
  if (!action) {
    return NextResponse.json(
      {
        error:
          "Invalid action. Expected one of: approve, reject, flag, reset.",
      },
      { status: 400 }
    );
  }

  const reasonRaw = typeof body.reason === "string" ? body.reason.trim() : "";
  if (action === "reject" && reasonRaw.length === 0) {
    return NextResponse.json(
      { error: "A moderation reason is required when rejecting." },
      { status: 400 }
    );
  }
  const reason = reasonRaw.length > 0 ? reasonRaw : null;

  // --- service client (bypasses RLS) --------------------------------------
  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/photos/moderate] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  // --- verify the photo belongs to the target business --------------------
  const { data: photo, error: fetchErr } = await admin
    .from("business_photos")
    .select(
      "id, business_id, url, moderation_status, moderation_reason, is_suspected_collage"
    )
    .eq("id", photoId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/photos/moderate] fetch", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // --- build the update ---------------------------------------------------
  //
  // Publish-first visibility contract (see the 2026-07-28 migration):
  //   approve  → stays live  (is_live = true)
  //   reject   → pulled down (is_live = false)  + rejection email
  //   flag     → held down   (is_live = false)
  //   reset    → back live   (is_live = true)   as pending
  const nowIso = new Date().toISOString();
  type PhotoUpdate = {
    moderation_status: "pending" | "approved" | "rejected" | "flagged";
    moderation_reason: string | null;
    moderated_at: string | null;
    moderated_by: string | null;
    is_live: boolean;
    is_suspected_collage?: boolean;
  };

  let update: PhotoUpdate;
  switch (action) {
    case "approve":
      update = {
        moderation_status: "approved",
        moderation_reason: null,
        moderated_at: nowIso,
        moderated_by: user.id,
        is_live: true,
        is_suspected_collage: false,
      };
      break;
    case "reject":
      update = {
        moderation_status: "rejected",
        moderation_reason: reason,
        moderated_at: nowIso,
        moderated_by: user.id,
        is_live: false,
      };
      break;
    case "flag":
      update = {
        moderation_status: "flagged",
        moderation_reason: reason,
        moderated_at: nowIso,
        moderated_by: user.id,
        is_live: false,
      };
      break;
    case "reset":
      update = {
        moderation_status: "pending",
        moderation_reason: null,
        moderated_at: null,
        moderated_by: null,
        is_live: true,
      };
      break;
  }

  const { data: updated, error: updErr } = await admin
    .from("business_photos")
    .update(update)
    .eq("id", photoId)
    .eq("business_id", businessId)
    .select(
      "id, moderation_status, moderation_reason, moderated_at, moderated_by, is_live, is_suspected_collage"
    )
    .maybeSingle();

  if (updErr) {
    console.error("[admin/photos/moderate] update", updErr);
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // --- fire-and-forget rejection email ------------------------------------
  let emailStatus: "sent" | "skipped" | "no_owner_email" = "skipped";
  if (action === "reject") {
    try {
      const { data: biz } = await admin
        .from("businesses")
        .select("name, owner_id")
        .eq("id", businessId)
        .maybeSingle();

      let ownerEmail: string | null = null;
      let ownerName: string | null = null;
      if (biz?.owner_id) {
        const { data: owner } = await admin
          .from("profiles")
          .select("email, display_name, full_name")
          .eq("id", biz.owner_id)
          .maybeSingle();
        const ownerRow = owner as
          | {
              email?: string | null;
              display_name?: string | null;
              full_name?: string | null;
            }
          | null;
        ownerEmail = ownerRow?.email?.trim() || null;
        ownerName =
          ownerRow?.display_name?.trim() ||
          ownerRow?.full_name?.trim() ||
          null;
      }

      if (ownerEmail) {
        // Intentionally awaited so we surface delivery failure in the
        // response for the admin (logged; does not fail the decision).
        await sendPhotoRejectedEmail({
          toEmail: ownerEmail,
          ownerName,
          businessName: biz?.name ?? null,
          moderationReason: reason,
        });
        emailStatus = "sent";
      } else {
        emailStatus = "no_owner_email";
      }
    } catch (e) {
      console.error("[admin/photos/moderate] email", e);
      emailStatus = "skipped";
    }
  }

  return NextResponse.json({
    ok: true,
    action,
    photo: updated,
    emailStatus,
  });
}
