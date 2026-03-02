import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      .select("id, business_id, status, expires_at")
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

    const expiresAt = (invite as { expires_at?: string | null }).expires_at;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Invite has expired." },
        { status: 400 }
      );
    }

    const inviteId = (invite as { id: string }).id;
    const businessId = (invite as { business_id: string }).business_id;
    const status = (invite as { status?: string }).status;

    if (status === "draft" || status === "sent") {
      await supabase
        .from("review_invites")
        .update({ status: "opened" })
        .eq("id", inviteId);

      await supabase.rpc("log_review_invite_event", {
        invite_id: inviteId,
        business_id: businessId,
        event_name: "opened",
        payload: {},
      });
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
