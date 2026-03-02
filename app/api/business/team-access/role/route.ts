import { NextResponse } from "next/server";
import {
  resolveUser,
  getOwnedBusiness,
  unauthorized,
  notFound,
  badRequest,
  serverError,
} from "../_shared";

const ALLOWED_ROLES = ["admin", "member"] as const;
type MemberRole = (typeof ALLOWED_ROLES)[number];

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
    const role     = typeof body.role     === "string" ? body.role.trim()     : "";

    if (!memberId) return badRequest("memberId is required.");
    if (!ALLOWED_ROLES.includes(role as MemberRole)) {
      return badRequest("Role must be 'admin' or 'member'.");
    }

    // Verify the member belongs to this business and is not the owner
    const { data: member, error: fetchErr } = await supabase
      .from("business_members")
      .select("id, role")
      .eq("id", memberId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[team-access role] fetch:", fetchErr);
      return serverError(fetchErr.message);
    }
    if (!member) return notFound("Member not found.");
    if ((member as any).role === "owner") {
      return badRequest("Cannot change the owner's role.");
    }

    const { error: updateErr } = await supabase
      .from("business_members")
      .update({ role })
      .eq("id", memberId)
      .eq("business_id", business.id)
      .neq("role", "owner");

    if (updateErr) {
      console.error("[team-access role] update:", updateErr);
      return serverError(updateErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[team-access role] unhandled:", err);
    return serverError("Unexpected server error.");
  }
}
