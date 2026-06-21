export const runtime = "nodejs";

/**
 * Daily cron (see vercel.json): one-time onboarding reminder to business owners
 * who verified their domain 24–48 hours ago but have never sent a review invite.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (Vercel Cron standard).
 * Window: UTC bounds (now() - 48h) .. (now() - 24h) on latest consumed_at.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendActivationReminderEmail } from "@/lib/businessActivationReminderEmail";
import { getServerEnv } from "@/lib/serverEnv";
import { resolveOwnerEmail } from "@/lib/resolveBusinessOwnerEmail";

const BATCH_LIMIT = 100;

type VerificationRow = {
  business_id: string;
  consumed_at: string;
};

type BusinessRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
  is_claimed: boolean | null;
  status: string | null;
};

type ProfileNameRow = {
  display_name: string | null;
  full_name: string | null;
};

/** Latest consumed_at per business must fall in [windowStart, windowEnd] (UTC). */
function businessesWithLatestVerifyInWindow(
  rows: VerificationRow[],
  windowStart: string,
  windowEnd: string,
): string[] {
  const globalMax = new Map<string, string>();
  for (const row of rows) {
    const bid = row.business_id;
    const consumed = row.consumed_at;
    if (!bid || !consumed) continue;
    const prev = globalMax.get(bid);
    if (!prev || consumed > prev) globalMax.set(bid, consumed);
  }

  const eligible: string[] = [];
  for (const [bid, latest] of globalMax) {
    if (latest >= windowStart && latest <= windowEnd) {
      eligible.push(bid);
    }
  }
  return eligible;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    if (token !== process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[send-activation-reminders] RESEND_API_KEY is missing.");
      return NextResponse.json(
        { error: "RESEND_API_KEY is missing." },
        { status: 500 },
      );
    }

    const nowMs = Date.now();
    const windowStart = new Date(nowMs - 48 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: verificationRows, error: verifyErr } = await supabase
      .from("business_domain_verifications")
      .select("business_id, consumed_at")
      .not("consumed_at", "is", null);

    if (verifyErr) {
      console.error("[send-activation-reminders] verifications:", verifyErr);
      return NextResponse.json({ error: verifyErr.message }, { status: 500 });
    }

    const verifyEligibleIds = businessesWithLatestVerifyInWindow(
      (verificationRows ?? []) as VerificationRow[],
      windowStart,
      windowEnd,
    );

    if (verifyEligibleIds.length === 0) {
      return NextResponse.json({
        success: true,
        windowStartUtc: windowStart,
        windowEndUtc: windowEnd,
        eligible: 0,
        sent: 0,
        skippedNoEmail: 0,
        failed: 0,
      });
    }

    const { data: businesses, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, owner_id, is_claimed, status")
      .in("id", verifyEligibleIds)
      .not("owner_id", "is", null)
      .eq("is_claimed", true)
      .eq("status", "active");

    if (bizErr) {
      console.error("[send-activation-reminders] businesses:", bizErr);
      return NextResponse.json({ error: bizErr.message }, { status: 500 });
    }

    const activeBusinessIds = (businesses ?? []).map(
      (b) => (b as BusinessRow).id,
    );

    if (activeBusinessIds.length === 0) {
      return NextResponse.json({
        success: true,
        windowStartUtc: windowStart,
        windowEndUtc: windowEnd,
        eligible: 0,
        sent: 0,
        skippedNoEmail: 0,
        failed: 0,
      });
    }

    const { data: sentInviteRows, error: inviteErr } = await supabase
      .from("review_invites")
      .select("business_id")
      .in("business_id", activeBusinessIds)
      .not("sent_at", "is", null);

    if (inviteErr) {
      console.error("[send-activation-reminders] review_invites:", inviteErr);
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }

    const activatedIds = new Set(
      (sentInviteRows ?? []).map(
        (r) => String((r as { business_id?: string }).business_id ?? ""),
      ),
    );

    const { data: alreadySentRows, error: dedupeErr } = await supabase
      .from("business_activation_reminder_emails")
      .select("business_id")
      .in("business_id", activeBusinessIds);

    if (dedupeErr) {
      console.error("[send-activation-reminders] dedupe lookup:", dedupeErr);
      return NextResponse.json({ error: dedupeErr.message }, { status: 500 });
    }

    const remindedIds = new Set(
      (alreadySentRows ?? []).map(
        (r) => String((r as { business_id?: string }).business_id ?? ""),
      ),
    );

    const candidateIds = activeBusinessIds.filter(
      (id) => !activatedIds.has(id) && !remindedIds.has(id),
    );

    const batchIds = candidateIds.slice(0, BATCH_LIMIT);

    let sent = 0;
    let skippedNoEmail = 0;
    let failed = 0;

    for (const businessId of batchIds) {
      const owner = await resolveOwnerEmail(supabase, businessId);
      if (!owner.email || !owner.ownerUserId) {
        skippedNoEmail += 1;
        console.warn(
          "[send-activation-reminders] skip no email:",
          businessId,
        );
        continue;
      }

      let ownerName: string | null = null;
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("id", owner.ownerUserId)
        .maybeSingle();
      const profile = profileRow as ProfileNameRow | null;
      ownerName =
        profile?.display_name?.trim() ||
        profile?.full_name?.trim() ||
        null;

      const result = await sendActivationReminderEmail({
        toEmail: owner.email,
        ownerName,
        businessName: owner.businessName,
      });

      if (result.status === "skipped") {
        skippedNoEmail += 1;
        continue;
      }

      if (result.status === "failed") {
        failed += 1;
        console.error(
          "[send-activation-reminders] send failed:",
          businessId,
          result.error,
        );
        continue;
      }

      const { error: insertErr } = await supabase
        .from("business_activation_reminder_emails")
        .upsert(
          {
            business_id: businessId,
            owner_user_id: owner.ownerUserId,
            recipient_email: owner.email,
            resend_message_id: result.messageId ?? null,
          },
          { onConflict: "business_id", ignoreDuplicates: true },
        );

      if (insertErr) {
        failed += 1;
        console.error(
          "[send-activation-reminders] dedupe insert failed:",
          businessId,
          insertErr,
        );
        continue;
      }

      sent += 1;
    }

    return NextResponse.json({
      success: true,
      windowStartUtc: windowStart,
      windowEndUtc: windowEnd,
      eligible: batchIds.length,
      sent,
      skippedNoEmail,
      failed,
    });
  } catch (error) {
    console.error("[send-activation-reminders] unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send activation reminders.",
      },
      { status: 500 },
    );
  }
}
