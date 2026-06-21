import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { sendAdminBusinessReinstatementEmail } from "@/lib/adminBusinessReinstatementEmail";
import { resolveOwnerEmail } from "@/lib/resolveBusinessOwnerEmail";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CUSTOM_NOTE_MAX = 2000;

function trimStr(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * POST /api/admin/businesses/approve-with-notice
 * Body: { businessId, customNote? }
 * - Sets status = 'active', submission_status = 'approved'
 * - If the listing was previously suspended, emails the owner that
 *   restrictions have been removed.
 * - Audits the action in `admin_business_status_notifications`.
 */
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

  let body: { businessId?: string; customNote?: string };
  try {
    body = (await req.json()) as { businessId?: string; customNote?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const businessId = String(body?.businessId ?? "").trim();
  if (!UUID_RE.test(businessId)) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const customNote = typeof body?.customNote === "string" ? body.customNote.trim() : "";
  if (customNote.length > CUSTOM_NOTE_MAX) {
    return NextResponse.json(
      { error: `Custom note must be at most ${CUSTOM_NOTE_MAX} characters.` },
      { status: 400 }
    );
  }

  let admin: ReturnType<typeof createClient>;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (e) {
    console.error("[approve-with-notice] env", e);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const before = await resolveOwnerEmail(admin, businessId);
  const wasSuspended =
    (before.status ?? "").toLowerCase() === "suspended" ||
    (before.submissionStatus ?? "").toLowerCase() === "suspended";

  const { error: rpcError } = await admin.rpc(
    "admin_update_business_status",
    {
      target_business_id: businessId,
      new_status: "active",
      new_submission_status: "approved",
    } as never
  );
  if (rpcError) {
    console.error("[approve-with-notice] admin_update_business_status:", rpcError);
    return NextResponse.json(
      { error: rpcError.message ?? "Failed to approve business" },
      { status: 500 }
    );
  }

  let emailWarning: string | null = null;
  let recipient: string | null = null;
  let emailSent = false;

  if (wasSuspended) {
    if (before.email && isValidEmail(before.email)) {
      recipient = before.email;
      const sendResult = await sendAdminBusinessReinstatementEmail({
        to: before.email,
        businessName: before.businessName ?? "your business listing",
        customNote: customNote.length > 0 ? customNote : null,
      });
      if (sendResult.ok) {
        emailSent = true;
      } else {
        emailWarning = `Listing was reinstated but the notification email could not be sent: ${sendResult.error}`;
      }
    } else {
      emailWarning =
        "Listing was reinstated but no registered owner email was found. The owner was not notified.";
    }
  }

  try {
    const auditInsert = {
      business_id: businessId,
      owner_user_id: before.ownerUserId,
      recipient_email: recipient ?? "",
      status_action: wasSuspended ? "reinstated" : "approved",
      reason_key: "general",
      reason_label: wasSuspended
        ? "Business listing reinstated"
        : "Business listing approved",
      custom_note: customNote.length > 0 ? customNote : null,
      sent_by_user_id: user.id,
      email_sent: emailSent,
      email_error: emailWarning,
    };
    const { error: insErr } = await admin
      .from("admin_business_status_notifications")
      .insert(auditInsert as never);
    if (insErr) {
      console.error("[approve-with-notice] audit insert:", insErr);
    }
  } catch (e) {
    console.error("[approve-with-notice] audit unexpected:", e);
  }

  return NextResponse.json({
    ok: true,
    recipient,
    warning: emailWarning,
    notified: emailSent,
    wasSuspended,
  });
}
