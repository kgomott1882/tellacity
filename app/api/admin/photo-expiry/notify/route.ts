import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { getActivePlanKeyForBusiness } from "@/lib/plans";
import {
  finalWarningCutoffIso,
  photoExpiresAtIso,
} from "@/lib/businessPhotoExpiry";
import { sendPhotoExpiryReminderEmail } from "@/lib/businessPhotoExpiryEmail";

/**
 * POST /api/admin/photo-expiry/notify
 * Body: { businessId: string }
 *
 * Admin-initiated reminder email for free-plan businesses whose photos are
 * inside the 24-hour final warning window. We re-check the plan on the
 * server (so a newly upgraded business can't be pinged by accident), count
 * their currently expiring photos, and send the owner an email via Resend.
 *
 * The endpoint is idempotent — calling it twice just sends a second
 * reminder; it does not mutate any DB row. The photo deletion sweep is
 * still driven by `/api/admin/photo-expiry/delete-expired` (or the cron
 * equivalent) — this endpoint only sends the email.
 *
 * Admin-only.
 */
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type BusinessRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
};

export async function POST(req: Request) {
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

  let body: { businessId?: string };
  try {
    body = (await req.json()) as { businessId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const businessId = String(body?.businessId ?? "").trim();
  if (!UUID_RE.test(businessId)) {
    return NextResponse.json(
      { error: "Invalid businessId" },
      { status: 400 }
    );
  }

  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/photo-expiry/notify] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  // Paid plans can't receive this email — it would be misleading. Re-check
  // the plan here so admin UI that's out of date can't send the wrong
  // message.
  const planKey = await getActivePlanKeyForBusiness(businessId, admin);
  if (planKey !== "free") {
    return NextResponse.json(
      {
        error: "Business is not on the free plan",
        planKey,
      },
      { status: 409 }
    );
  }

  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id, name, owner_id")
    .eq("id", businessId)
    .maybeSingle<BusinessRow>();
  if (bizErr) {
    console.error("[admin/photo-expiry/notify] business", bizErr);
    return NextResponse.json({ error: bizErr.message }, { status: 500 });
  }
  if (!biz) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }
  if (!biz.owner_id) {
    return NextResponse.json(
      { error: "Business has no claimed owner", emailStatus: "no_owner" },
      { status: 409 }
    );
  }

  const { data: ownerProfile, error: ownerErr } = await admin
    .from("profiles")
    .select("id, email, display_name, full_name")
    .eq("id", biz.owner_id)
    .maybeSingle<ProfileRow>();
  if (ownerErr) {
    console.error("[admin/photo-expiry/notify] profile", ownerErr);
    return NextResponse.json({ error: ownerErr.message }, { status: 500 });
  }
  const ownerEmail = ownerProfile?.email?.trim().toLowerCase() ?? "";
  if (!ownerEmail) {
    return NextResponse.json(
      {
        error: "Owner has no email on file",
        emailStatus: "no_owner_email",
      },
      { status: 409 }
    );
  }

  // Recount the expiring window server-side — never trust the client.
  const now = new Date();
  const warningCutoff = finalWarningCutoffIso(now);
  const { data: expiringRows, error: rowsErr } = await admin
    .from("business_photos")
    .select("id, created_at")
    .eq("business_id", businessId)
    .lte("created_at", warningCutoff)
    .order("created_at", { ascending: true });
  if (rowsErr) {
    console.error("[admin/photo-expiry/notify] rows", rowsErr);
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }
  const expiringCount = expiringRows?.length ?? 0;
  if (expiringCount === 0) {
    return NextResponse.json(
      {
        error: "Nothing to notify — no photos in the expiry window",
        emailStatus: "no_expiring_photos",
      },
      { status: 409 }
    );
  }

  const earliestCreatedAt = expiringRows?.[0]?.created_at ?? null;
  const earliestRemovalAtIso = photoExpiresAtIso(earliestCreatedAt);

  const result = await sendPhotoExpiryReminderEmail({
    toEmail: ownerEmail,
    ownerName:
      ownerProfile?.display_name?.trim() ||
      ownerProfile?.full_name?.trim() ||
      null,
    businessName: biz.name ?? null,
    expiringCount,
    earliestRemovalAtIso,
  });

  if (result.status === "failed") {
    return NextResponse.json(
      {
        error: result.error,
        emailStatus: "failed",
      },
      { status: 502 }
    );
  }
  if (result.status !== "sent") {
    return NextResponse.json(
      {
        error: "Email was not delivered",
        emailStatus: result.status,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    emailStatus: "sent",
    expiringCount,
    earliestRemovalAtIso,
    emailId: result.id ?? null,
  });
}
