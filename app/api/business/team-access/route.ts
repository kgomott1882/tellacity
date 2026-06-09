import { NextResponse } from "next/server";
import {
  resolveUser,
  getOwnedBusiness,
  unauthorized,
  notFound,
  serverError,
} from "./_shared";

export async function GET(req: Request) {
  try {
    const { user, supabase } = await resolveUser(req);
    if (!user || !supabase) return unauthorized();

    const business = await getOwnedBusiness(supabase, user.id);
    if (!business) return notFound();

    // Fetch active members
    const { data: members, error: membersErr } = await supabase
      .from("business_members")
      .select("id, user_id, role, status, created_at, can_write_articles")
      .eq("business_id", business.id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (membersErr) {
      console.error("[team-access GET] members:", membersErr);
      return serverError(membersErr.message);
    }

    // Enrich members with email from auth.users via admin API
    const enriched = await Promise.all(
      (members ?? []).map(async (m: any) => {
        let email: string | null = null;
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(m.user_id);
          email = userData?.user?.email ?? null;
        } catch {
          // non-fatal
        }
        return {
          id:         m.id,
          user_id:    m.user_id,
          email,
          role:       m.role,
          status:     m.status,
          created_at: m.created_at,
          can_write_articles: m.can_write_articles === true,
        };
      })
    );

    // Fetch pending invites
    const { data: invites, error: invitesErr } = await supabase
      .from("business_member_invites")
      .select("id, email, role, status, created_at, accepted_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (invitesErr) {
      console.error("[team-access GET] invites:", invitesErr);
      return serverError(invitesErr.message);
    }

    const all = (invites ?? []) as Array<{
      id: string;
      email: string;
      role: string;
      status: string;
      created_at: string;
      accepted_at: string | null;
    }>;

    const pendingInvites = all.filter((i) => i.status === "pending");
    const inviteHistory = all
      .filter((i) => i.status !== "pending")
      .sort((a, b) => {
        const ta = new Date(a.accepted_at ?? a.created_at).getTime();
        const tb = new Date(b.accepted_at ?? b.created_at).getTime();
        return tb - ta;
      });

    return NextResponse.json({
      members: enriched,
      pendingInvites,
      inviteHistory,
      /** @deprecated use pendingInvites */
      invites: all,
    });
  } catch (err: any) {
    console.error("[team-access GET] unhandled:", err);
    return serverError("Unexpected server error.");
  }
}
