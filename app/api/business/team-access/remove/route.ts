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

    const memberId = typeof body.memberId === "string" ? body.memberId.trim() : "";
    if (!memberId) return badRequest("memberId is required.");

    // Verify member belongs to this business and is not the owner
    const { data: member, error: fetchErr } = await supabase
      .from("business_members")
      .select("id, role")
      .eq("id", memberId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[team-access remove] fetch:", fetchErr);
      return serverError(fetchErr.message);
    }
    if (!member) return notFound("Member not found.");
    if ((member as any).role === "owner") {
      return badRequest("Cannot remove the owner.");
    }

    const { error: updateErr } = await supabase
      .from("business_members")
      .update({ status: "removed" })
      .eq("id", memberId)
      .eq("business_id", business.id)
      .neq("role", "owner");

    if (updateErr) {
      console.error("[team-access remove] update:", updateErr);
      return serverError(updateErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[team-access remove] unhandled:", err);
    return serverError("Unexpected server error.");
  }
}
