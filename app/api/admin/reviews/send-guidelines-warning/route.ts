import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { sendAdminReviewGuidelinesWarningEmail } from "@/lib/adminReviewGuidelinesWarningEmail";
import {
  getAdminReviewWarningReasonLabel,
  isAdminReviewWarningReasonKey,
  type AdminReviewWarningReasonKey,
} from "@/lib/adminReviewWarningReasons";
import { emailsFromAuthUsersByIds } from "@/lib/reviewerEmailResolution";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimStr(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function profileEmailFromEmbed(r: Record<string, unknown>): string | null {
  const p = r["profiles:consumer_id"] as
    | { email?: string | null }
    | { email?: string | null }[]
    | null
    | undefined;
  if (!p) return null;
  if (Array.isArray(p)) return trimStr(p[0]?.email);
  return trimStr(p.email);
}

const CUSTOM_NOTE_MAX = 2000;

/**
 * POST /api/admin/reviews/send-guidelines-warning
 * Body: { reviewId: string, reasonKey: string, customNote?: string }
 *
 * Sends a no-reply guidelines notice to the reviewer email on file. Admin-only.
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

  let body: { reviewId?: string; reasonKey?: string; customNote?: string };
  try {
    body = (await req.json()) as { reviewId?: string; reasonKey?: string; customNote?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reviewId = String(body?.reviewId ?? "").trim();
  if (!UUID_RE.test(reviewId)) {
    return NextResponse.json({ error: "Invalid reviewId" }, { status: 400 });
  }

  const reasonRaw = String(body?.reasonKey ?? "general").trim();
  if (!isAdminReviewWarningReasonKey(reasonRaw)) {
    return NextResponse.json({ error: "Invalid reasonKey" }, { status: 400 });
  }
  const reasonKey = reasonRaw as AdminReviewWarningReasonKey;

  let customNote = typeof body?.customNote === "string" ? body.customNote.trim() : "";
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
    console.error("[send-guidelines-warning] env", e);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: row, error: fetchErr } = await admin
    .from("reviews")
    .select(
      `
      id,
      email,
      author_email,
      guest_email,
      user_id,
      consumer_id,
      businesses (
        name
      ),
      profiles:consumer_id (
        email
      )
    `
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!row || typeof row !== "object") {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const r = row as Record<string, unknown>;
  const uid = trimStr(r.user_id);
  const consumerId = trimStr(r.consumer_id);

  const ids = new Set<string>();
  if (uid) ids.add(uid);
  if (consumerId) ids.add(consumerId);

  let emailByUserId = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", [...ids]);
    if (profs && profs.length > 0) {
      emailByUserId = new Map(
        profs
          .map((p) => {
            const e = trimStr(p.email);
            if (!e || p.id == null) return null;
            return [String(p.id), e] as [string, string];
          })
          .filter((x): x is [string, string] => x != null)
      );
    }
  }

  const profileIdsNeedingAuth = [...ids].filter((id) => !emailByUserId.has(id));
  const authEmails =
    profileIdsNeedingAuth.length > 0
      ? await emailsFromAuthUsersByIds(admin, profileIdsNeedingAuth)
      : new Map<string, string>();

  const embedEmail = profileEmailFromEmbed(r);
  const profileEmail = uid ? emailByUserId.get(uid) : undefined;
  const consumerProfileEmail = consumerId ? emailByUserId.get(consumerId) : undefined;

  const recipient =
    trimStr(r.email) ||
    trimStr(r.author_email) ||
    trimStr(r.guest_email) ||
    embedEmail ||
    trimStr(profileEmail) ||
    trimStr(consumerProfileEmail) ||
    trimStr(uid ? authEmails.get(uid) : undefined) ||
    trimStr(consumerId ? authEmails.get(consumerId) : undefined) ||
    null;

  if (!recipient || recipient === "-" || !isValidEmail(recipient)) {
    return NextResponse.json(
      { error: "No valid reviewer email on file for this review." },
      { status: 400 }
    );
  }

  const b = r.businesses;
  let businessName = "the business";
  if (Array.isArray(b) && b[0] && typeof b[0] === "object" && b[0] !== null) {
    businessName = String((b[0] as { name?: string | null }).name ?? "").trim() || businessName;
  } else if (b && typeof b === "object" && "name" in b) {
    businessName = String((b as { name?: string | null }).name ?? "").trim() || businessName;
  }

  const sendResult = await sendAdminReviewGuidelinesWarningEmail({
    to: recipient,
    businessName,
    reasonKey,
    customNote: customNote.length > 0 ? customNote : null,
  });

  if (!sendResult.ok) {
    return NextResponse.json({ error: sendResult.error }, { status: 500 });
  }

  const { error: insErr } = await admin.from("admin_review_guideline_warning_emails").insert({
    review_id: reviewId,
    recipient_email: recipient,
    sent_by_user_id: user.id,
    reason_key: reasonKey,
    custom_note: customNote.length > 0 ? customNote : null,
    reason_label: getAdminReviewWarningReasonLabel(reasonKey),
  });

  let auditWarning: string | null = null;
  if (insErr) {
    console.error("[send-guidelines-warning] audit insert:", insErr);
    auditWarning =
      "Email was sent but the audit log could not be saved. Check server logs and table migration.";
  }

  const { error: flagErr } = await admin
    .from("reviews")
    .update({ is_flagged: true, updated_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (flagErr) {
    console.error("[send-guidelines-warning] flag review:", flagErr);
    return NextResponse.json(
      {
        error:
          "Email was sent but the review could not be flagged automatically. Flag it manually if needed.",
        warning: auditWarning ?? undefined,
      },
      { status: 500 }
    );
  }

  if (auditWarning) {
    return NextResponse.json({ ok: true, recipient, warning: auditWarning });
  }

  return NextResponse.json({ ok: true, recipient });
}
