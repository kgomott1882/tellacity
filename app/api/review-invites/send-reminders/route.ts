export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";
import { getPublicAppOrigin, getInviteFinalizeUrl } from "@/lib/emailBranding";
import {
  reviewInviteRowIsExpired,
  reviewInviteRowIsUsed,
} from "@/lib/reviewInviteValidation";
import { computeReviewInviteExpiresAtIso } from "@/lib/reviewInviteExpiry";

type ReminderInvite = {
  id: string;
  token: string;
  recipient_email: string;
  opened_at: string | null;
  reminder_count: number | null;
  review_submitted_at: string | null;
  expires_at: string | null;
};

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: "Tellacity <notifications@tellacity.com>",
    to,
    subject,
    html,
  });
  if (result.error) {
    throw new Error(String(result.error));
  }
}

export async function GET(request: Request) {
  try {
    // Match existing cron endpoint auth style.
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    if (token !== process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[send-reminders] RESEND_API_KEY is missing.");
      return NextResponse.json(
        { error: "RESEND_API_KEY is missing." },
        { status: 500 }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: invites, error: invitesError } = await supabase
      .rpc("get_review_invites_for_reminders");

    if (invitesError) {
      console.error("[send-reminders] RPC get_review_invites_for_reminders failed:", invitesError);
      return NextResponse.json(
        { error: invitesError.message },
        { status: 500 }
      );
    }

    const rows = (invites ?? []) as ReminderInvite[];
    const baseUrl = getPublicAppOrigin();
    let processed = 0;
    let skipped = 0;

    console.log(`[send-reminders] fetched invites: ${rows.length}`);

    const seenIds = new Set<string>();

    for (const invite of rows) {
      try {
        if (seenIds.has(invite.id)) {
          skipped += 1;
          continue;
        }
        seenIds.add(invite.id);

        if (invite.review_submitted_at || reviewInviteRowIsUsed(invite)) {
          console.log(
            `[send-reminders] skipping invite ${invite.id}: review already submitted`
          );
          skipped += 1;
          continue;
        }

        if (reviewInviteRowIsExpired(invite)) {
          console.log(
            `[send-reminders] skipping invite ${invite.id}: expired`
          );
          skipped += 1;
          continue;
        }

        const email = invite.recipient_email;
        const inviteUrl = getInviteFinalizeUrl(baseUrl, invite.token);
        const isOpened = !!invite.opened_at;
        const reminderExpiresAt = computeReviewInviteExpiresAtIso();

        const subject = isOpened
          ? "Reminder: Finish your review"
          : "Reminder: Please leave a review";

        const body = isOpened
          ? "You started your review. Click below to finish it."
          : "We’d love your feedback. Click below to leave a review.";

        await sendEmail({
          to: email,
          subject,
          html: `<p>${body}</p><p><a href="${inviteUrl}">Leave review</a></p>`,
        });

        const { error: updateError } = await supabase
          .from("review_invites")
          .update({
            reminder_count: (invite.reminder_count ?? 0) + 1,
            last_reminder_sent_at: new Date().toISOString(),
            expires_at: reminderExpiresAt,
          })
          .eq("id", invite.id);

        if (updateError) {
          console.error(
            `[send-reminders] failed DB update for invite ${invite.id}:`,
            updateError
          );
          continue;
        }

        processed += 1;
      } catch (inviteError) {
        console.error(
          `[send-reminders] failed invite ${invite.id}:`,
          inviteError
        );
      }
    }

    console.log(`[send-reminders] completed. processed=${processed}`);

    return NextResponse.json({
      success: true,
      processed,
      skipped,
    });
  } catch (error) {
    console.error("[send-reminders] unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send reminders.",
      },
      { status: 500 }
    );
  }
}
