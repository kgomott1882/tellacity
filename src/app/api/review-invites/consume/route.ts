import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  reviewInviteRowIsExpired,
  reviewInviteRowIsUsed,
  type InviteRowRecord,
} from "@/lib/reviewInviteValidation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token } = (body || {}) as { token?: string };

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "token is required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: invite, error: fetchError } = await supabase
      .from("review_invites")
      .select("*")
      .eq("token", token.trim())
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to look up invite." },
        { status: 500 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found." },
        { status: 404 }
      );
    }

    const row = invite as InviteRowRecord;

    if (reviewInviteRowIsUsed(row)) {
      return NextResponse.json(
        { error: "This invitation link has already been used." },
        { status: 400 }
      );
    }

    if (reviewInviteRowIsExpired(row)) {
      return NextResponse.json(
        { error: "Invite has expired." },
        { status: 400 }
      );
    }

    const inviteId = row.id;
    const businessId = row.business_id;
    if (typeof inviteId !== "string" || typeof businessId !== "string") {
      return NextResponse.json(
        { error: "Invalid invite." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      inviteId,
      businessId,
    });
  } catch (e) {
    console.error("review-invites/consume error", e);
    return NextResponse.json(
      { error: "Failed to consume invite." },
      { status: 500 }
    );
  }
}
