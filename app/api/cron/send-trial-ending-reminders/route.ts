export const runtime = "nodejs";

/**
 * Daily cron (see vercel.json): one-time reminder to business owners whose Grow
 * trial ends in ~3 days (UTC window on current_period_end).
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (Vercel Cron standard).
 * Window: current_period_end between (now + 2d) and (now + 4d), UTC.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTrialEndingEmail } from "@/lib/businessTrialEndingEmail";
import { getServerEnv } from "@/lib/serverEnv";
import { resolveOwnerEmail } from "@/lib/resolveBusinessOwnerEmail";

const BATCH_LIMIT = 100;

type SubscriptionRow = {
  business_id: string;
  current_period_end: string | null;
};

type ProfileNameRow = {
  display_name: string | null;
  full_name: string | null;
};

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
      console.error("[send-trial-ending-reminders] RESEND_API_KEY is missing.");
      return NextResponse.json(
        { error: "RESEND_API_KEY is missing." },
        { status: 500 },
      );
    }

    const nowMs = Date.now();
    const windowStart = new Date(nowMs + 2 * 24 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(nowMs + 4 * 24 * 60 * 60 * 1000).toISOString();

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: subscriptionRows, error: subErr } = await supabase
      .from("subscriptions")
      .select("business_id, current_period_end")
      .eq("status", "trialing")
      .gte("current_period_end", windowStart)
      .lte("current_period_end", windowEnd);

    if (subErr) {
      console.error("[send-trial-ending-reminders] subscriptions:", subErr);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const trialingIds = [
      ...new Set(
        (subscriptionRows ?? [])
          .map((r) => String((r as SubscriptionRow).business_id ?? "").trim())
          .filter(Boolean),
      ),
    ];

    if (trialingIds.length === 0) {
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

    const { data: alreadySentRows, error: dedupeErr } = await supabase
      .from("business_trial_ending_emails")
      .select("business_id")
      .in("business_id", trialingIds);

    if (dedupeErr) {
      console.error("[send-trial-ending-reminders] dedupe lookup:", dedupeErr);
      return NextResponse.json({ error: dedupeErr.message }, { status: 500 });
    }

    const remindedIds = new Set(
      (alreadySentRows ?? []).map(
        (r) => String((r as { business_id?: string }).business_id ?? ""),
      ),
    );

    const candidateIds = trialingIds.filter((id) => !remindedIds.has(id));
    const batchIds = candidateIds.slice(0, BATCH_LIMIT);

    const trialEndByBusinessId = new Map<string, string>();
    for (const row of subscriptionRows ?? []) {
      const sub = row as SubscriptionRow;
      const businessId = String(sub.business_id ?? "").trim();
      const trialEnd = String(sub.current_period_end ?? "").trim();
      if (businessId && trialEnd) {
        trialEndByBusinessId.set(businessId, trialEnd);
      }
    }

    let sent = 0;
    let skippedNoEmail = 0;
    let failed = 0;

    for (const businessId of batchIds) {
      const owner = await resolveOwnerEmail(supabase, businessId);
      if (!owner.email || !owner.ownerUserId) {
        skippedNoEmail += 1;
        console.warn(
          "[send-trial-ending-reminders] skip no email:",
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

      const result = await sendTrialEndingEmail({
        toEmail: owner.email,
        ownerName,
        businessName: owner.businessName,
        trialEndIso: trialEndByBusinessId.get(businessId) ?? null,
      });

      if (result.status === "skipped") {
        skippedNoEmail += 1;
        continue;
      }

      if (result.status === "failed") {
        failed += 1;
        console.error(
          "[send-trial-ending-reminders] send failed:",
          businessId,
          result.error,
        );
        continue;
      }

      const { error: insertErr } = await supabase
        .from("business_trial_ending_emails")
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
          "[send-trial-ending-reminders] dedupe insert failed:",
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
    console.error("[send-trial-ending-reminders] unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send trial ending reminders.",
      },
      { status: 500 },
    );
  }
}
