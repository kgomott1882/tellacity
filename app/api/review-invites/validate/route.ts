import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token } = (body || {}) as { token?: string };

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "Token is required." },
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
    const now = new Date().toISOString();

    const { data: invite, error } = await supabase
      .from("review_invites")
      .select(
        "id, business_id, status, expires_at, used_at, businesses(id, name, slug)"
      )
      .eq("token", token.trim())
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invalid invite link." },
        { status: 400 }
      );
    }

    const expiresAt = (invite as { expires_at?: string | null }).expires_at;
    if (expiresAt && new Date(expiresAt) < new Date(now)) {
      return NextResponse.json(
        { error: "Invalid or expired invite link." },
        { status: 400 }
      );
    }

    if ((invite as { used_at?: string | null }).used_at) {
      return NextResponse.json(
        { error: "This invitation link has already been used." },
        { status: 400 }
      );
    }

    // Mark as opened if first time
    if (invite.status === "sent" || invite.status === "draft") {
      await supabase
        .from("review_invites")
        .update({
          status: "opened",
          opened_at: now,
        })
        .eq("id", invite.id);
    }

    // Log event (non-blocking; ignore failures)
    await supabase
      .from("review_invite_events")
      .insert({
        invite_id: invite.id,
        event_type: "opened",
      })
      .catch(() => {});

    const businessName = (invite as { businesses?: { name?: string | null } | null }).businesses?.name ?? null;
    const businessSlug = (invite as { businesses?: { slug?: string | null } | null }).businesses?.slug ?? null;

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      businessId: invite.business_id,
      businessName,
      businessSlug,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid invite link." },
      { status: 500 }
    );
  }
}