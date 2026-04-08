import { NextResponse } from "next/server";
import {
  resolveUser,
  getOwnedBusiness,
  unauthorized,
  notFound,
  badRequest,
  serverError,
} from "../_shared";

export async function POST(req: Request) {
  try {
    const { user, supabase } = await resolveUser(req);
    if (!user || !supabase) return unauthorized();

    const business = await getOwnedBusiness(supabase, user.id);
    if (!business) return notFound();

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const inviteId = typeof body.inviteId === "string" ? body.inviteId.trim() : "";
    if (!inviteId) return badRequest("inviteId is required.");

    const { data: invite, error: fetchErr } = await supabase
      .from("business_member_invites")
      .select("id, status")
      .eq("id", inviteId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[team-access invite-cancel] fetch:", fetchErr);
      return serverError(fetchErr.message);
    }
    if (!invite) return notFound("Invite not found.");
    if ((invite as { status: string }).status !== "pending") {
      return badRequest("Only pending invitations can be cancelled.");
    }

    const { error: updErr } = await supabase
      .from("business_member_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId)
      .eq("business_id", business.id)
      .eq("status", "pending");

    if (updErr) {
      console.error("[team-access invite-cancel] update:", updErr);
      return serverError(updErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[team-access invite-cancel] unhandled:", err);
    return serverError("Unexpected server error.");
  }
}
