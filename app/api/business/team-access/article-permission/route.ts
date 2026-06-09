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
    const enabled = body.enabled === true;

    if (!memberId) return badRequest("memberId is required.");

    const { data: member, error: fetchErr } = await supabase
      .from("business_members")
      .select("id, role")
      .eq("id", memberId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[team-access article-permission] fetch:", fetchErr);
      return serverError(fetchErr.message);
    }
    if (!member) return notFound("Member not found.");
    if ((member as { role?: string }).role === "owner") {
      return badRequest("Owners always have article access.");
    }

    const { error: updateErr } = await supabase
      .from("business_members")
      .update({ can_write_articles: enabled })
      .eq("id", memberId)
      .eq("business_id", business.id)
      .neq("role", "owner");

    if (updateErr) {
      console.error("[team-access article-permission] update:", updateErr);
      return serverError(updateErr.message);
    }

    return NextResponse.json({ success: true, can_write_articles: enabled });
  } catch (err: unknown) {
    console.error("[team-access article-permission] unhandled:", err);
    return serverError("Unexpected server error.");
  }
}
