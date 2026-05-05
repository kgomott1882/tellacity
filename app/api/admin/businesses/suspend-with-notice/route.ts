import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { sendAdminBusinessSuspensionEmail } from "@/lib/adminBusinessSuspensionEmail";
import {
  getAdminBusinessSuspensionReasonLabel,
  isAdminBusinessSuspensionReasonKey,
  type AdminBusinessSuspensionReasonKey,
} from "@/lib/adminBusinessSuspensionReasons";

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
 * Best-effort: pick the registered owner email for a given business.
 * Order: business_profiles.email (by owner_id) → auth.users.email (by owner_id) → business_owners → business_profiles by user_id.
 */
type BusinessOwnerRow = {
  id?: string | null;
  name?: string | null;
  owner_id?: string | null;
};

type BusinessOwnersRow = {
  owner_user_id?: string | null;
};

type BusinessProfileEmailRow = {
  email?: string | null;
};

async function resolveOwnerEmail(
  admin: ReturnType<typeof createClient>,
  businessId: string
): Promise<{ ownerUserId: string | null; email: string | null; businessName: string | null }> {
  const { data: bizRaw } = await admin
    .from("businesses")
    .select("id, name, owner_id")
    .eq("id", businessId)
    .maybeSingle();

  const biz = bizRaw as BusinessOwnerRow | null;
  if (!biz) return { ownerUserId: null, email: null, businessName: null };

  const businessName = trimStr(biz.name);
  let ownerUserId: string | null =
    biz.owner_id != null ? String(biz.owner_id).trim() : null;

  if (!ownerUserId) {
    const { data: boRaw } = await admin
      .from("business_owners")
      .select("owner_user_id")
      .eq("business_id", businessId)
      .maybeSingle();
    const bo = boRaw as BusinessOwnersRow | null;
    const uid =
      bo?.owner_user_id != null ? String(bo.owner_user_id).trim() : "";
    ownerUserId = uid || null;
  }

  let email: string | null = null;

  if (ownerUserId) {
    const { data: bpRaw } = await admin
      .from("business_profiles")
      .select("email")
      .eq("id", ownerUserId)
      .maybeSingle();
    const bp = bpRaw as BusinessProfileEmailRow | null;
    const bpEmail =
      typeof bp?.email === "string" ? bp.email.trim().toLowerCase() : "";
    if (bpEmail.includes("@")) email = bpEmail;

    if (!email) {
      const { data: bp2Raw } = await admin
        .from("business_profiles")
        .select("email")
        .eq("user_id", ownerUserId)
        .maybeSingle();
      const bp2 = bp2Raw as BusinessProfileEmailRow | null;
      const bp2Email =
        typeof bp2?.email === "string" ? bp2.email.trim().toLowerCase() : "";
      if (bp2Email.includes("@")) email = bp2Email;
    }

    if (!email) {
      try {
        const { data: userRes } = await admin.auth.admin.getUserById(ownerUserId);
        const authEmail =
          typeof userRes?.user?.email === "string"
            ? userRes.user.email.trim().toLowerCase()
            : "";
        if (authEmail.includes("@")) email = authEmail;
      } catch (e) {
        console.warn("[suspend-with-notice] auth.admin.getUserById failed", e);
      }
    }
  }

  return { ownerUserId, email, businessName };
}

/**
 * POST /api/admin/businesses/suspend-with-notice
 * Body: { businessId, reasonKey, customNote? }
 * - Suspends the business (status + submission_status = 'suspended')
 * - Emails the registered owner explaining the reason
 * - Audits the notification in `admin_business_status_notifications`
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

  let body: { businessId?: string; reasonKey?: string; customNote?: string };
  try {
    body = (await req.json()) as { businessId?: string; reasonKey?: string; customNote?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const businessId = String(body?.businessId ?? "").trim();
  if (!UUID_RE.test(businessId)) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

  const reasonRaw = String(body?.reasonKey ?? "general").trim();
  if (!isAdminBusinessSuspensionReasonKey(reasonRaw)) {
    return NextResponse.json({ error: "Invalid reasonKey" }, { status: 400 });
  }
  const reasonKey = reasonRaw as AdminBusinessSuspensionReasonKey;

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
    console.error("[suspend-with-notice] env", e);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { error: rpcError } = await admin.rpc(
    "admin_update_business_status",
    {
      target_business_id: businessId,
      new_status: "suspended",
      new_submission_status: "suspended",
    } as never
  );
  if (rpcError) {
    console.error("[suspend-with-notice] admin_update_business_status:", rpcError);
    return NextResponse.json(
      { error: rpcError.message ?? "Failed to suspend business" },
      { status: 500 }
    );
  }

  const { ownerUserId, email, businessName } = await resolveOwnerEmail(admin, businessId);

  let emailWarning: string | null = null;
  let recipient: string | null = null;
  if (email && isValidEmail(email)) {
    recipient = email;
    const sendResult = await sendAdminBusinessSuspensionEmail({
      to: email,
      businessName: businessName ?? "your business listing",
      reasonKey,
      customNote: customNote.length > 0 ? customNote : null,
    });
    if (!sendResult.ok) {
      emailWarning = `Business was suspended but the notification email could not be sent: ${sendResult.error}`;
    }
  } else {
    emailWarning =
      "Business was suspended but no registered owner email was found. The owner was not notified.";
  }

  try {
    const auditInsert = {
      business_id: businessId,
      owner_user_id: ownerUserId,
      recipient_email: recipient ?? "",
      status_action: "suspended",
      reason_key: reasonKey,
      reason_label: getAdminBusinessSuspensionReasonLabel(reasonKey),
      custom_note: customNote.length > 0 ? customNote : null,
      sent_by_user_id: user.id,
      email_sent: emailWarning === null,
      email_error: emailWarning,
    };
    const { error: insErr } = await admin
      .from("admin_business_status_notifications")
      .insert(auditInsert as never);
    if (insErr) {
      console.error("[suspend-with-notice] audit insert:", insErr);
    }
  } catch (e) {
    console.error("[suspend-with-notice] audit unexpected:", e);
  }

  return NextResponse.json({
    ok: true,
    recipient,
    warning: emailWarning,
  });
}
